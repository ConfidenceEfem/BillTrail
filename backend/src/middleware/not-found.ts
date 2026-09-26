import type { RequestHandler } from "express";
import { NotFoundError } from "../lib/errors";

/** Runs only when no route matched. It hands a proper error to the error handler. */
export const notFound: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`Route not found: ${req.method} ${req.path}`));
};
