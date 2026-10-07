import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma";
import { createAuthedUser, createPaidInvoiceFor } from "./helpers";
import { getAvailableBalance } from "../src/modules/withdrawals/balance.service";

describe("getAvailableBalance", () => {
  it("is zero for a business with no payments", async () => {
    const owner = await createAuthedUser();
    expect(await getAvailableBalance(owner.businessId)).toBe(0);
  });

  it("equals total successful payments when there are no withdrawals", async () => {
    const owner = await createAuthedUser();
    await createPaidInvoiceFor(owner.businessId, 50_000_00);
    await createPaidInvoiceFor(owner.businessId, 30_000_00);

    expect(await getAvailableBalance(owner.businessId)).toBe(80_000_00);
  });

  it("subtracts PENDING and PROCESSING withdrawals, not just SUCCESS ones", async () => {
    const owner = await createAuthedUser();
    await createPaidInvoiceFor(owner.businessId, 100_000_00);

    const bankAccount = await prisma.bankAccount.create({
      data: {
        businessId: owner.businessId,
        accountNumber: "0000000000",
        bankCode: "000",
        bankName: "Test Bank",
        accountName: "Test Owner",
      },
    });

    await prisma.withdrawal.create({
      data: {
        businessId: owner.businessId,
        bankAccountId: bankAccount.id,
        amount: 40_000_00,
        status: "PENDING",
        paystackReference: `wd_test_${Date.now()}`,
      },
    });

    expect(await getAvailableBalance(owner.businessId)).toBe(60_000_00);
  });

  it("never returns negative, even if withdrawals somehow exceed payments", async () => {
    const owner = await createAuthedUser();
    await createPaidInvoiceFor(owner.businessId, 10_000_00);

    const bankAccount = await prisma.bankAccount.create({
      data: {
        businessId: owner.businessId,
        accountNumber: "0000000000",
        bankCode: "000",
        bankName: "Test Bank",
        accountName: "Test Owner",
      },
    });
    await prisma.withdrawal.create({
      data: {
        businessId: owner.businessId,
        bankAccountId: bankAccount.id,
        amount: 50_000_00,
        status: "SUCCESS",
        paystackReference: `wd_test_${Date.now()}`,
      },
    });

    expect(await getAvailableBalance(owner.businessId)).toBe(0);
  });
});