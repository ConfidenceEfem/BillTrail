import { z } from "zod";

const lineItemSchema = z.object({
  description: z.string().trim().min(1, "Description is required").max(200),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  unitPrice: z.number().int().nonnegative("Unit price cannot be negative"),
});

export const createInvoiceSchema = z.object({
  clientId: z.uuid("Invalid client id"),
  items: z.array(lineItemSchema).min(1, "An invoice needs at least one item"),
  taxRateBps: z.number().int().min(0).max(10_000).default(0), 
  discountAmount: z.number().int().nonnegative().default(0),
  dueDate: z.coerce.date(),
  notes: z.string().trim().max(1000).optional(),
});
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const updateInvoiceSchema = createInvoiceSchema.partial();
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;

export const invoiceIdParamSchema = z.object({
  id: z.uuid("Invalid invoice id"),
});

export const listInvoicesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["DRAFT", "SENT", "PAID", "CANCELLED"]).optional(),
  clientId: z.uuid().optional(),
});
export type ListInvoicesQuery = z.infer<typeof listInvoicesQuerySchema>;