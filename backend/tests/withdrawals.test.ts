import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma";
import { createAuthedUser } from "./helpers";
import { processPaystackEvent } from "../src/modules/webhooks/webhooks.service";

async function createProcessingWithdrawal(businessId: string) {
  const bankAccount = await prisma.bankAccount.create({
    data: {
      businessId,
      accountNumber: "0000000000",
      bankCode: "000",
      bankName: "Test Bank",
      accountName: "Test Owner",
    },
  });
  const reference = `wd_${Date.now()}_${Math.random()}`;
  const withdrawal = await prisma.withdrawal.create({
    data: { businessId, bankAccountId: bankAccount.id, amount: 20_000_00, status: "PROCESSING", paystackReference: reference },
  });
  return { withdrawal, reference };
}

describe("processPaystackEvent — transfers", () => {
  it("marks a withdrawal SUCCESS on transfer.success", async () => {
    const owner = await createAuthedUser();
    const { withdrawal, reference } = await createProcessingWithdrawal(owner.businessId);

    await processPaystackEvent(`evt_${reference}`, {
      event: "transfer.success",
      data: { reference, amount: 20_000_00, status: "success" },
    });

    const updated = await prisma.withdrawal.findUniqueOrThrow({ where: { id: withdrawal.id } });
    expect(updated.status).toBe("SUCCESS");
    expect(updated.completedAt).not.toBeNull();
  });

  it("marks a withdrawal FAILED on transfer.failed", async () => {
    const owner = await createAuthedUser();
    const { withdrawal, reference } = await createProcessingWithdrawal(owner.businessId);

    await processPaystackEvent(`evt_${reference}`, {
      event: "transfer.failed",
      data: { reference, amount: 20_000_00, status: "failed" },
    });

    const updated = await prisma.withdrawal.findUniqueOrThrow({ where: { id: withdrawal.id } });
    expect(updated.status).toBe("FAILED");
    expect(updated.failureReason).toBeTruthy();
  });

  it("ignores a transfer event for a reference it doesn't recognise", async () => {
    const result = await processPaystackEvent("evt_unknown_transfer", {
      event: "transfer.success",
      data: { reference: "never_existed", amount: 1000, status: "success" },
    });
    expect(result.handled).toBe(false);
  });

  it("processing the same transfer event twice only applies the change once", async () => {
    const owner = await createAuthedUser();
    const { reference } = await createProcessingWithdrawal(owner.businessId);
    const eventId = `evt_${reference}`;
    const payload = { event: "transfer.success", data: { reference, amount: 20_000_00, status: "success" } };

    const first = await processPaystackEvent(eventId, payload);
    const second = await processPaystackEvent(eventId, payload);

    expect(first.alreadyProcessed).toBe(false);
    expect(second.alreadyProcessed).toBe(true);
  });
});