import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(150),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  phone: z.string().trim().max(30).optional(),
});
export type CreateClientInput = z.infer<typeof createClientSchema>;

// Same rules, but every field is optional — a PATCH can update just one field.
export const updateClientSchema = createClientSchema.partial();
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

export const listClientsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>;

export const clientIdParamSchema = z.object({
  id: z.uuid("Invalid client id"),
});