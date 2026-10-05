import { Router } from "express";
import { downloadPublicPdf, getInvoice, payInvoice } from "./public.controller";

export const publicRouter = Router();

publicRouter.get("/invoices/:token", getInvoice);
publicRouter.post("/invoices/:token/pay", payInvoice);
publicRouter.get("/invoices/:token/pdf", downloadPublicPdf);