import type { RequestHandler } from "express";
import { loginSchema, registerSchema, verifyEmailSchema, refreshSchema, resetPasswordSchema, requestPasswordResetSchema } from "./auth.validation";
import { getCurrentUser, login, registerBusiness, verifyEmail,rotateRefreshToken,revokeRefreshToken, resetPassword, requestPasswordReset } from "./auth.service";
import { logger } from "../../config/logger";
import { sendEmail } from "../../lib/email";
import { passwordResetEmailHtml, verificationEmailHtml } from "../../lib/email-templates";
import { env } from "../../config/env";

export const register: RequestHandler = async (req, res) => {
  const input = registerSchema.parse(req.body);

  const { user, verificationToken } = await registerBusiness(input);


  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  logger.info(
    { verificationLink: verifyUrl },
    "Email verification link (dev only)",
  );

   await sendEmail({
    to: user.email,
    subject: "Verify your BillTrail account",
    html: verificationEmailHtml(verifyUrl),
  });

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


  const resetLink = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;

  if (rawToken) {
    logger.info(
      { resetLink:resetLink },
      "Password reset link (dev only)",
    );
  }

  await sendEmail({
    to: input.email,
    subject: "Reset Password on your BillTrail account",
    html: passwordResetEmailHtml(resetLink),
  })

  res.status(200).json({ data: { message: "Reset Link has been set to email" } });
};

export const resetPasswordHandler: RequestHandler = async (req, res) => {
  const input = resetPasswordSchema.parse(req.body);
  await resetPassword(input.token, input.newPassword);
  res.status(200).json({ data: { message: "Password reset successfully" } });
};