import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { isProduction } from "../config/env";
import { logger } from "../config/logger";
import { AppError } from "../lib/errors";

type ErrorBody = {
  error: { code: string; message: string; details?: unknown };
};

function isBodyParserError(err: unknown): err is { status: number; type: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    "type" in err &&
    typeof (err as { type: unknown }).type === "string" &&
    (err as { type: string }).type.startsWith("entity.")
  );
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let status = 500;
  let body: ErrorBody = {
    error: { code: "INTERNAL_ERROR", message: "Something went wrong on our side" },
  };

  if (err instanceof AppError) {
    status = err.statusCode;
    body = { error: { code: err.code, message: err.message, details: err.details } };
  } else if (err instanceof ZodError) {
    status = 400;
    body = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    };
  } else if (isBodyParserError(err)) {
    status = err.status;
    body = { error: { code: "BAD_REQUEST", message: "Malformed or oversized request body" } };
  }

  if (status >= 500) {
    logger.error({ err }, "Unhandled error");
  }

  if (!isProduction && status >= 500 && err instanceof Error) {
    body.error.details = { name: err.name, message: err.message, stack: err.stack };
  }

  res.status(status).json(body);
};
