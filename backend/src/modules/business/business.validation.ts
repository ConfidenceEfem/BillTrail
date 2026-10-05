import { z } from "zod";

export const updateBusinessSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100).optional(),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(300).optional(),
});
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;