import { Router } from "express";
import { getInvoice, payInvoice } from "./public.controller";

export const publicRouter = Router();

publicRouter.get("/invoices/:token", getInvoice);
publicRouter.post("/invoices/:token/pay", payInvoice);