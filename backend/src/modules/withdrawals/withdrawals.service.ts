import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma";
import { BadRequestError, NotFoundError } from "../../lib/errors";
import { createTransferRecipient, initiateTransfer } from "../../lib/paystack";
import { getAvailableBalance } from "./balance.service";
import type { CreateWithdrawalInput } from "./withdrawals.validation";

const MINIMUM_WITHDRAWAL_KOBO = 100_00; // NGN 

export async function requestWithdrawal(businessId: string, input: CreateWithdrawalInput) {
  const bankAccount = await prisma.bankAccount.findFirst({
    where: { id: input.bankAccountId, businessId },
  });
  if (!bankAccount) throw new NotFoundError("Bank account not found");

  const amountKobo = Math.round(input.amountNaira * 100);
  if (amountKobo < MINIMUM_WITHDRAWAL_KOBO) {
    throw new BadRequestError(`Minimum withdrawal is ${MINIMUM_WITHDRAWAL_KOBO / 100} NGN`);
  }

  const availableBalance = await getAvailableBalance(businessId);
  if (amountKobo > availableBalance) {
    throw new BadRequestError("Insufficient balance for this withdrawal");
  }


  let recipientCode = bankAccount.recipientCode;
  if (!recipientCode) {
    recipientCode = await createTransferRecipient({
      accountNumber: bankAccount.accountNumber,
      bankCode: bankAccount.bankCode,
      accountName: bankAccount.accountName,
    });
    await prisma.bankAccount.update({ where: { id: bankAccount.id }, data: { recipientCode } });
  }

  const reference = `wd_${randomUUID()}`;


  const withdrawal = await prisma.withdrawal.create({
    data: {
      businessId,
      bankAccountId: bankAccount.id,
      amount: amountKobo,
      status: "PENDING",
      paystackReference: reference,
    },
  });

  try {
    const transfer = await initiateTransfer({
      amountKobo,
      recipientCode,
      reference,
      reason: "BillTrail withdrawal",
    });

    await prisma.withdrawal.update({
      where: { id: withdrawal.id },
      data: { status: "PROCESSING", paystackTransferCode: transfer.transfer_code },
    });
  } catch (err) {
  
    await prisma.withdrawal.update({
      where: { id: withdrawal.id },
      data: { status: "FAILED", failureReason: (err as Error).message },
    });
    throw err;
  }

  return prisma.withdrawal.findUniqueOrThrow({ where: { id: withdrawal.id } });
}

export async function listWithdrawals(businessId: string) {
  return prisma.withdrawal.findMany({
    where: { businessId },
    include: { bankAccount: { select: { bankName: true, accountNumber: true, accountName: true } } },
    orderBy: { createdAt: "desc" },
  });
}