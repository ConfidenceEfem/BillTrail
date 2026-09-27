import jwt from "jsonwebtoken";
import { env } from "../../config/env";

export type AccessTokenPayload = {
  sub: string;
  businessId: string;
  type: "access";
};

export function signAccessToken(payload: Omit<AccessTokenPayload, "type">): string {
  const fullPayload: AccessTokenPayload = { ...payload, type: "access" };
  return jwt.sign(fullPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (typeof decoded === "string" || decoded.type !== "access") {
    throw new Error("Not an access token");
  }
  return decoded as AccessTokenPayload;
}