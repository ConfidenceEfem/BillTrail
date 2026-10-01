import type { RequestHandler } from "express";
import {
  createInvoiceSchema,
  invoiceIdParamSchema,
  listInvoicesQuerySchema,
  updateInvoiceSchema,
} from "./invoices.validation";
import {
  cancelInvoice,
  createInvoice,
  deleteInvoice,
  getInvoice,
  listInvoices,
  sendInvoice,
  updateInvoice,
} from "./invoices.service";
import { sendEmail } from "../../lib/email";
import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { invoiceSentEmailHtml } from "../../lib/email-templates";
import { formatKobo } from "../../lib/money";
import { logger } from "../../config/logger";

export const create: RequestHandler = async (req, res) => {
  const input = createInvoiceSchema.parse(req.body);
  const invoice = await createInvoice(req.user!.businessId, input);
  res.status(201).json({ data: invoice });
};

export const list: RequestHandler = async (req, res) => {
  const query = listInvoicesQuerySchema.parse(req.query);
  const result = await listInvoices(req.user!.businessId, query);
  res.status(200).json({
    data: result.invoices,
    meta: { total: result.total, page: result.page, pageSize: result.pageSize },
  });
};

export const getOne: RequestHandler = async (req, res) => {
  const { id } = invoiceIdParamSchema.parse(req.params);
  const invoice = await getInvoice(req.user!.businessId, id);
  res.status(200).json({ data: invoice });
};

export const update: RequestHandler = async (req, res) => {
  const { id } = invoiceIdParamSchema.parse(req.params);
  const input = updateInvoiceSchema.parse(req.body);
  const invoice = await updateInvoice(req.user!.businessId, id, input);
  res.status(200).json({ data: invoice });
};

export const remove: RequestHandler = async (req, res) => {
  const { id } = invoiceIdParamSchema.parse(req.params);
  await deleteInvoice(req.user!.businessId, id);
  res.status(204).send();
};

export const send: RequestHandler = async (req, res) => {
  const { id } = invoiceIdParamSchema.parse(req.params);
  const invoice = await sendInvoice(req.user!.businessId, id);

  const business = await prisma.business.findUniqueOrThrow({ where: { id: req.user!.businessId } });
  const payUrl = `${env.FRONTEND_URL}/pay/${invoice.publicToken}`;

  await sendEmail({
    to: invoice.client.email,
    subject: `Invoice ${invoice.number} from ${business.name}`,
    html: invoiceSentEmailHtml({
      businessName: business.name,
      invoiceNumber: invoice.number,
      totalFormatted: formatKobo(invoice.total, invoice.currency),
      dueDateFormatted: invoice.dueDate.toLocaleDateString("en-NG", { dateStyle: "long" }),
      payUrl,
    }),
  });

   logger.info(
      { verificationLink: payUrl },
      "Sending invoice link (dev only)",
    );

  res.status(200).json({ data: invoice });
};

export const cancel: RequestHandler = async (req, res) => {
  const { id } = invoiceIdParamSchema.parse(req.params);
  const invoice = await cancelInvoice(req.user!.businessId, id);
  res.status(200).json({ data: invoice });
};