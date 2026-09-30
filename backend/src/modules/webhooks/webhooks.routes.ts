import { Router } from "express";
import { paystackWebhook } from "./webhooks.controller";

export const webhooksRouter = Router();

webhooksRouter.post("/paystack", paystackWebhook);