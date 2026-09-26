import { logger } from "./config/logger";
import { AppError, NotFoundError } from "./lib/errors";

const error = new NotFoundError("Invoice not found");

logger.info(
  {
    isAppError: error instanceof AppError,
    isError: error instanceof Error,
    name: error.name,
    statusCode: error.statusCode,
    code: error.code,
  },
  error.message,
);
