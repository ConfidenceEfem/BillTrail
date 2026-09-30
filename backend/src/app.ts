import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env";
import { pinoHttp } from "pino-http";
import { randomUUID } from "node:crypto";
import { logger } from "./config/logger";
import { healthRouter } from "./modules/health/health.routes";
import { notFound } from "./middleware/not-found";
import { errorHandler } from "./middleware/error-handler";
import authRouter from "./modules/auth/auth.routes";
import clientRouter from "./modules/clients/clients.routes";
import { invoicesRouter } from "./modules/invoices/invoices.routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIGIN, credentials: true }));
  app.use(
    pinoHttp({
      logger,
      serializers: {
        req: (req) => ({
          id: req.id,
          method: req.method,
          url: req.url,
        }),
        res: (res) => ({
          statusCode: res.statusCode,
        }),
      },
      genReqId: (req, res) => {
        const existing = req.headers["x-request-id"];
        const id = typeof existing === "string" && existing ? existing : randomUUID();
        res.setHeader("x-request-id", id);
        return id;
      },
    }),
  );

  app.use(express.json({ limit: "100kb" }));
  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/auth", authRouter)
  app.use("/api/v1/clients", clientRouter)
  app.use("/api/v1/invoices", invoicesRouter)

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
