import type { RequestHandler } from "express";
import {
  createRecurringInvoiceSchema,
  recurringInvoiceIdParamSchema,
  updateRecurringInvoiceSchema,
} from "./recurring-invoices.validation";
import {
  createRecurringInvoice,
  deleteRecurringInvoice,
  getRecurringInvoice,
  listRecurringInvoices,
  updateRecurringInvoice,
} from "./recurring-invoices.service";

export const create: RequestHandler = async (req, res) => {
  const input = createRecurringInvoiceSchema.parse(req.body);
  const template = await createRecurringInvoice(req.user!.businessId, input);
  res.status(201).json({ data: template });
};

export const list: RequestHandler = async (req, res) => {
  const templates = await listRecurringInvoices(req.user!.businessId);
  res.status(200).json({ data: templates });
};

export const getOne: RequestHandler = async (req, res) => {
  const { id } = recurringInvoiceIdParamSchema.parse(req.params);
  const template = await getRecurringInvoice(req.user!.businessId, id);
  res.status(200).json({ data: template });
};

export const update: RequestHandler = async (req, res) => {
  const { id } = recurringInvoiceIdParamSchema.parse(req.params);
  const input = updateRecurringInvoiceSchema.parse(req.body);
  const template = await updateRecurringInvoice(req.user!.businessId, id, input);
  res.status(200).json({ data: template });
};

export const remove: RequestHandler = async (req, res) => {
  const { id } = recurringInvoiceIdParamSchema.parse(req.params);
  await deleteRecurringInvoice(req.user!.businessId, id);
  res.status(204).send();
};