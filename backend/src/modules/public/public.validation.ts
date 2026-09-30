import { z } from "zod";

export const publicInvoiceTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
});
export type PublicInvoiceTokenInput = z.infer<typeof publicInvoiceTokenSchema>;

