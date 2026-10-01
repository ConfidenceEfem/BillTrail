import { prisma } from "../../lib/prisma";

export async function getDashboardSummary(businessId: string) {
  const now = new Date();

  const [revenueResult, outstandingResult, overdueResult, overdueCount] = await Promise.all([
    prisma.invoice.aggregate({
      where: { businessId, status: "PAID" },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: { businessId, status: "SENT" },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: { businessId, status: "SENT", dueDate: { lt: now } },
      _sum: { total: true },
    }),
    prisma.invoice.count({
      where: { businessId, status: "SENT", dueDate: { lt: now } },
    }),
  ]);

  return {
    totalRevenue: revenueResult._sum.total ?? 0,
    outstanding: outstandingResult._sum.total ?? 0,
    overdueAmount: overdueResult._sum.total ?? 0,
    overdueCount,
  };
}