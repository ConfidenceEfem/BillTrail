import type { RequestHandler } from "express";
import { UnauthorizedError } from "../lib/errors";
import { verifyAccessToken } from "../modules/auth/auth.token";

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or malformed Authorization header");
  }

  const token = header.slice("Bearer ".length);

  try {
    req.user = verifyAccessToken(token);
  } catch {

    throw new UnauthorizedError("Invalid or expired token");
  }

  next();
};