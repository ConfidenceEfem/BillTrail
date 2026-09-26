import pino from "pino";
import { env } from "./env";

export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : env.LOG_LEVEL,
  // Never let secrets reach the logs.
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      'req.headers["x-paystack-signature"]',
      "password",
      "passwordHash",
      "token",
      "refreshToken",
      "*.password",
      "*.passwordHash",
      "*.token",
      "*.refreshToken",
    ],
    censor: "[REDACTED]",
  },
  transport: env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
});
