import { z } from "zod";

export const resolveAccountSchema = z.object({
  accountNumber: z.string().length(10, "Account number must be 10 digits"),
  bankCode: z.string().min(1, "Bank is required"),
});
export type ResolveAccountInput = z.infer<typeof resolveAccountSchema>;

export const saveBankAccountSchema = resolveAccountSchema.extend({
  bankName: z.string().min(1),
});
export type SaveBankAccountInput = z.infer<typeof saveBankAccountSchema>;

export const bankAccountIdParamSchema = z.object({
  id: z.uuid("Invalid id"),
});

export const createWithdrawalSchema = z.object({
  bankAccountId: z.uuid("Invalid bank account id"),
  amountNaira: z.number().positive("Amount must be greater than 0"),
});
export type CreateWithdrawalInput = z.infer<typeof createWithdrawalSchema>;