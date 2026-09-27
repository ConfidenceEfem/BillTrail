import { randomBytes, createHash } from "node:crypto";

/** A random, hard-to-guess token, sent to the user (in a link or an API response). */
export function generateRawToken(): string {
  return randomBytes(32).toString("hex");
}

/** The one-way hash of a token, which is what we actually store in the database. */
export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}