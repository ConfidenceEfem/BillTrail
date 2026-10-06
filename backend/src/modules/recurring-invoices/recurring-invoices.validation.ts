import { z } from "zod";

const lineItemSchema = z.object({
  description: z.string().trim().min(1, "Required").max(200),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().nonnegative(),
});

export const createRecurringInvoiceSchema = z.object({
  clientId: z.uuid("Invalid client id"),
  items: z.array(lineItemSchema).min(1, "At least one item is required"),
  taxRateBps: z.number().int().min(0).max(10_000).default(0),
  discountAmount: z.number().int().nonnegative().default(0),
  frequency: z.enum(["WEEKLY", "MONTHLY"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  autoSend: z.boolean().default(false),
  notes: z.string().trim().max(1000).optional(),
});
export type CreateRecurringInvoiceInput = z.infer<typeof createRecurringInvoiceSchema>;

export const updateRecurringInvoiceSchema = z.object({
  isActive: z.boolean().optional(),
  autoSend: z.boolean().optional(),
  endDate: z.coerce.date().nullable().optional(),
});
export type UpdateRecurringInvoiceInput = z.infer<typeof updateRecurringInvoiceSchema>;

export const recurringInvoiceIdParamSchema = z.object({
  id: z.uuid("Invalid id"),
});