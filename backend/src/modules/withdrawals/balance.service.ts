import { prisma } from "../../lib/prisma";

export async function getAvailableBalance(businessId: string) {
  const [paymentsResult, withdrawalsResult] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: "SUCCESS", invoice: { businessId } },
      _sum: { amount: true },
    }),

    prisma.withdrawal.aggregate({
      where: { businessId, status: { in: ["PENDING", "PROCESSING", "SUCCESS"] } },
      _sum: { amount: true },
    }),
  ]);

  const totalReceived = paymentsResult._sum.amount ?? 0;
  const totalWithdrawn = withdrawalsResult._sum.amount ?? 0;

  return Math.max(0, totalReceived - totalWithdrawn);
}