import type { RequestHandler } from "express";
import { loginSchema, registerSchema, verifyEmailSchema, refreshSchema, resetPasswordSchema, requestPasswordResetSchema } from "./auth.validation";
import { getCurrentUser, login, registerBusiness, verifyEmail,rotateRefreshToken,revokeRefreshToken, resetPassword, requestPasswordReset } from "./auth.service";
import { logger } from "../../config/logger";

export const register: RequestHandler = async (req, res) => {
  const input = registerSchema.parse(req.body);

  const { user, verificationToken } = await registerBusiness(input);

  logger.info(
    { verificationLink: `http://localhost:5173/verify-email?token=${verificationToken}` },
    "Email verification link (dev only)",
  );

  res.status(201).json({ data: user });
};

export const verifyEmailHandler: RequestHandler = async (req, res) => {
  const input = verifyEmailSchema.parse(req.query);

  await verifyEmail(input.token);

  res.status(200).json({ data: { message: "Email verified successfully" } });
};

export const loginHandler: RequestHandler = async (req, res) => {
  const input = loginSchema.parse(req.body);

  const { accessToken, refreshToken } = await login(input.email, input.password);

  res.status(200).json({ data: { accessToken, refreshToken } });
};

export const me: RequestHandler = async (req, res) => {
  const user = await getCurrentUser(req.user!.sub);
  res.status(200).json({ data: user });
};

export const refreshHandler: RequestHandler = async (req, res) => {
  const input = refreshSchema.parse(req.body);
  const tokens = await rotateRefreshToken(input.refreshToken);
  res.status(200).json({ data: tokens });
};

export const logoutHandler: RequestHandler = async (req, res) => {
  const input = refreshSchema.parse(req.body);
  await revokeRefreshToken(input.refreshToken);
  res.status(200).json({ data: { message: "Logged out" } });
};

export const requestPasswordResetHandler: RequestHandler = async (req, res) => {
  const input = requestPasswordResetSchema.parse(req.body);
  const rawToken = await requestPasswordReset(input.email);

  if (rawToken) {
    logger.info(
      { resetLink: `http://localhost:5173/reset-password?token=${rawToken}` },
      "Password reset link (dev only)",
    );
  }

  // Same response whether or not the account exists.
  res.status(200).json({ data: { message: "If that email exists, a reset link has been sent" } });
};

export const resetPasswordHandler: RequestHandler = async (req, res) => {
  const input = resetPasswordSchema.parse(req.body);
  await resetPassword(input.token, input.newPassword);
  res.status(200).json({ data: { message: "Password reset successfully" } });
};