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
  res.status(200).json({ data: invoice });
};

export const cancel: RequestHandler = async (req, res) => {
  const { id } = invoiceIdParamSchema.parse(req.params);
  const invoice = await cancelInvoice(req.user!.businessId, id);
  res.status(200).json({ data: invoice });
};