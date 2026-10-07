import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";
import { resolveBankAccount } from "../../lib/paystack";
import type { SaveBankAccountInput } from "./withdrawals.validation";

export async function previewBankAccount(accountNumber: string, bankCode: string) {
  return resolveBankAccount(accountNumber, bankCode);
}

export async function addBankAccount(businessId: string, input: SaveBankAccountInput) {

  const resolved = await resolveBankAccount(input.accountNumber, input.bankCode);

  const existingCount = await prisma.bankAccount.count({ where: { businessId } });

  return prisma.bankAccount.create({
    data: {
      businessId,
      accountNumber: input.accountNumber,
      bankCode: input.bankCode,
      bankName: input.bankName,
      accountName: resolved.account_name,
      isDefault: existingCount === 0, // the first account added is automatically the default
    },
  });
}

export async function listBankAccounts(businessId: string) {
  return prisma.bankAccount.findMany({ where: { businessId }, orderBy: { createdAt: "asc" } });
}

export async function deleteBankAccount(businessId: string, id: string) {
  const account = await prisma.bankAccount.findFirst({ where: { id, businessId } });
  if (!account) throw new NotFoundError("Bank account not found");

  const withdrawalCount = await prisma.withdrawal.count({ where: { bankAccountId: id } });
  if (withdrawalCount > 0) {
    throw new Error("Cannot delete a bank account with withdrawal history");
  }

  await prisma.bankAccount.delete({ where: { id } });
}