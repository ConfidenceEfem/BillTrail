import type { RequestHandler } from "express";
import { loginSchema, registerSchema, verifyEmailSchema, refreshSchema } from "./auth.validation";
import { getCurrentUser, login, registerBusiness, verifyEmail,rotateRefreshToken,revokeRefreshToken } from "./auth.service";
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