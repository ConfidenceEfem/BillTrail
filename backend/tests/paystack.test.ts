import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { env } from "../src/config/env";
import { verifyPaystackSignature } from "../src/lib/paystack";
import { processPaystackEvent } from "../src/modules/webhooks/webhooks.service";
import { prisma } from "../src/lib/prisma";
import { createAuthedUser } from "./helpers";

function signBody(body: string) {
  return createHmac("sha512", env.PAYSTACK_SECRET_KEY).update(body).digest("hex");
}

describe("verifyPaystackSignature", () => {
  it("accepts a correctly signed body", () => {
    const body = Buffer.from(JSON.stringify({ event: "charge.success" }));
    const signature = signBody(body.toString());

    expect(verifyPaystackSignature(body, signature)).toBe(true);
  });

  it("rejects a body that was tampered with after signing", () => {
    const original = JSON.stringify({ event: "charge.success", data: { amount: 1000 } });
    const signature = signBody(original);

    const tampered = Buffer.from(JSON.stringify({ event: "charge.success", data: { amount: 999999 } }));

    expect(verifyPaystackSignature(tampered, signature)).toBe(false);
  });

  it("rejects a missing signature header", () => {
    const body = Buffer.from(JSON.stringify({ event: "charge.success" }));
    expect(verifyPaystackSignature(body, undefined)).toBe(false);
  });

  it("rejects a signature signed with the wrong secret", () => {
    const body = Buffer.from(JSON.stringify({ event: "charge.success" }));
    const wrongSignature = createHmac("sha512", "not-the-real-secret").update(body).digest("hex");

    expect(verifyPaystackSignature(body, wrongSignature)).toBe(false);
  });
});

async function setupSentInvoiceWithPayment() {
  const owner = await createAuthedUser();
  const client = await prisma.client.create({
    data: { businessId: owner.businessId, name: "Webhook Test Client", email: `wh-${Date.now()}@example.com` },
  });
  const invoice = await prisma.invoice.create({
    data: {
      businessId: owner.businessId,
      clientId: client.id,
      number: `INV-WH-${Date.now()}`,
      subtotal: 50_000_00,
      total: 50_000_00,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "SENT",
    },
  });
  const reference = `test_ref_${Date.now()}`;
  await prisma.payment.create({
    data: { invoiceId: invoice.id, amount: invoice.total, currency: "NGN", status: "PENDING", reference },
  });
  return { invoice, reference };
}

describe("processPaystackEvent", () => {
  it("marks the payment and invoice paid on a matching charge.success event", async () => {
    const { invoice, reference } = await setupSentInvoiceWithPayment();

    await processPaystackEvent(`evt_${reference}`, {
      event: "charge.success",
      data: { reference, amount: 50_000_00, status: "success" },
    });

    const payment = await prisma.payment.findUniqueOrThrow({ where: { reference } });
    const updated = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });

    expect(payment.status).toBe("SUCCESS");
    expect(updated.status).toBe("PAID");
    expect(updated.paidAt).not.toBeNull();
  });

  it("processing the exact same event twice only applies the change once", async () => {
    const { reference } = await setupSentInvoiceWithPayment();
    const eventId = `evt_${reference}`;
    const payload = { event: "charge.success", data: { reference, amount: 50_000_00, status: "success" } };

    const first = await processPaystackEvent(eventId, payload);
    const second = await processPaystackEvent(eventId, payload);

    expect(first.alreadyProcessed).toBe(false);
    expect(second.alreadyProcessed).toBe(true);

    const events = await prisma.webhookEvent.findMany({ where: { eventId } });
    expect(events).toHaveLength(1); // the unique constraint blocked the duplicate insert
  });

  it("does not mark the invoice paid if the amount does not match", async () => {
    const { invoice, reference } = await setupSentInvoiceWithPayment();

    await processPaystackEvent(`evt_${reference}`, {
      event: "charge.success",
      data: { reference, amount: 1_00, status: "success" }, // way too small
    });

    const updated = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(updated.status).toBe("SENT"); // unchanged
  });

  it("ignores an event for a reference it doesn't recognise", async () => {
    const result = await processPaystackEvent("evt_unknown", {
      event: "charge.success",
      data: { reference: "never_existed", amount: 1000, status: "success" },
    });

    expect(result.handled).toBe(false);
  });
});