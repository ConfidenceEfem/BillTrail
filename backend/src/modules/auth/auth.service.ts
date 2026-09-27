import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { BadRequestError, ConflictError, UnauthorizedError } from "../../lib/errors";
import type { RegisterInput } from "./auth.validation";
import { generateRawToken, hashToken } from "../../lib/token";
import { signAccessToken } from "./auth.token";
import { env } from "../../config/env";
import ms from "ms";

const BCRYPT_SALT_ROUNDS = env.NODE_ENV === "test" ? 4 : 12;
const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000; 
const REFRESH_TOKEN_TTL_MS = ms(env.JWT_REFRESH_EXPIRES_IN as ms.StringValue);

const PASSWORD_RESET_EXPIRY_MS = 30 * 60 * 1000; 

export async function registerBusiness (e: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: {email: e.email},
    select: {id: true}
  })

  if(existing){
    throw new ConflictError("User already exists")
  }

  const passwordHash = await bcrypt.hash(e.password, BCRYPT_SALT_ROUNDS)

  const rawToken =  generateRawToken()

  const hashRawToken = hashToken(rawToken)

  const emailVerificationExpiryDate = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MS)

  const user = await prisma.user.create({
    data:{
        email: e.email,
        passwordHash,
        emailVerificationTokenHash: hashRawToken,
        emailVerificationExpiresAt: emailVerificationExpiryDate,
        business: {
            create: {
                name: e.businessName
            }
        }
    },
    select: {
        id: true, 
        email: true,
        createdAt: true,
        business: {
            select: {
                id: true, name: true
            }
        }
    }
  })

  return {user, verificationToken: rawToken}

}

export async function verifyEmail(rawToken: string) {
  const tokenHash = hashToken(rawToken);

  const user = await prisma.user.findFirst({
    where: { emailVerificationTokenHash: tokenHash },
    select: { id: true, emailVerifiedAt: true, emailVerificationExpiresAt: true },
  });

  if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
    throw new BadRequestError("This verification link is invalid or has expired");
  }

  if (user.emailVerifiedAt) {
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
    },
  });
}


export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, emailVerifiedAt: true, business: { select: { id: true } } },
  });
  const invalidCredentials = () => new UnauthorizedError("Invalid email or password");

  if (!user) {
    await bcrypt.compare(password, "$2b$12$invalidsaltinvalidsaltinvalidsal.tuOezt6PZDvS1eKz9O0i0O0i0O0i0e");
    throw invalidCredentials();
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw invalidCredentials();
  }

  if (!user.emailVerifiedAt) {
    throw new UnauthorizedError("Please verify your email before logging in");
  }

  if (!user.business) {
    throw new Error(`User ${user.id} has no associated business`);
  }

const accessToken = signAccessToken({ sub: user.id, businessId: user.business.id });
const refreshToken = await issueRefreshToken(user.id);

return { accessToken, refreshToken };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      emailVerifiedAt: true,
      business: { select: { id: true, name: true } },
    },
  });
  return user;
}

async function issueRefreshToken(userId: string) {
  const rawToken = generateRawToken();
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });
  return rawToken;
}

export async function rotateRefreshToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: { include: { business: true } } },
  });

  // Same vague error for "doesn't exist", "expired", and "revoked" — an
  // attacker probing stolen or guessed tokens learns nothing from the response.
  const invalid = () => new UnauthorizedError("Invalid or expired refresh token");

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw invalid();
  }
  if (!stored.user.business) {
    throw new Error(`User ${stored.userId} has no associated business`);
  }

  // Rotation: the old token is revoked the moment it's used, and a brand new
  // one is issued. If a stolen refresh token is ever used by an attacker AND
  // later by the real user (or vice versa), the second use fails outright,
  // which is a strong signal something is wrong — not just a nice-to-have.
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const accessToken = signAccessToken({ sub: stored.userId, businessId: stored.user.business.id });
  const refreshToken = await issueRefreshToken(stored.userId);

  return { accessToken, refreshToken };
}

export async function revokeRefreshToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  // updateMany, not update: if the token doesn't exist (already invalid, or
  // never existed), logout should still succeed quietly — there's nothing
  // meaningful to tell the caller either way.
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}



export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  if (!user) return null;

  const rawToken = generateRawToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: hashToken(rawToken),
      passwordResetExpiresAt: new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS),
    },
  });

  return rawToken;
}

export async function resetPassword(rawToken: string, newPassword: string) {
  const tokenHash = hashToken(rawToken);
  const user = await prisma.user.findFirst({
    where: { passwordResetTokenHash: tokenHash },
    select: { id: true, passwordResetExpiresAt: true },
  });

  if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
    throw new BadRequestError("This reset link is invalid or has expired");
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    }),

    prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}