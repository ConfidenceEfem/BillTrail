import type { RequestHandler } from "express";
import { logger } from "../../config/logger";
import { verifyPaystackSignature } from "../../lib/paystack";
import { processPaystackEvent } from "./webhooks.service";

export const paystackWebhook: RequestHandler = async (req, res) => {
  const rawBody = req.body as Buffer;
  const signature = req.headers["x-paystack-signature"] as string | undefined;

  if (!verifyPaystackSignature(rawBody, signature)) {
    logger.warn("Rejected a Paystack webhook with an invalid signature");
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid signature" } });
    return;
  }

  const payload = JSON.parse(rawBody.toString("utf8"));
  const eventId = `${payload.event}:${payload.data?.reference}:${payload.data?.status}`;

  await processPaystackEvent(eventId, payload);

  res.status(200).json({ received: true });
};