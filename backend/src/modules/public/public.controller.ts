import type { RequestHandler } from "express";
import { publicInvoiceTokenSchema } from "./public.validation";
import { getPublicInvoicePdf } from "./public.service";
import { getInvoiceByPublicToken, initiateInvoicePayment } from "./public.service";

export const payInvoice: RequestHandler = async (req, res) => {
  const { token } = publicInvoiceTokenSchema.parse(req.params);
  const result = await initiateInvoicePayment(token);
  res.status(200).json({ data: result });
};

export const getInvoice: RequestHandler = async (req, res) => {
  const { token } = publicInvoiceTokenSchema.parse(req.params);
  const invoice = await getInvoiceByPublicToken(token);
  res.status(200).json({ data: invoice });
};


export const downloadPublicPdf: RequestHandler = async (req, res) => {
  const { token } = publicInvoiceTokenSchema.parse(req.params);
  const pdfBuffer = await getPublicInvoicePdf(token);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="invoice.pdf"`);
  res.send(pdfBuffer);
};