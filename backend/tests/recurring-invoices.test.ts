import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma";
import { createAuthedUser } from "./helpers";
import { generateDueRecurringInvoices } from "../src/modules/recurring-invoices/recurring-invoice-generator";

async function createClientAndTemplate(
  businessId: string,
  overrides: Partial<{ nextRunDate: Date; endDate: Date | null; autoSend: boolean }> = {},
) {
  const client = await prisma.client.create({
    data: {
      businessId,
      name: "Recurring Test Client",
      email: `recurring-${Date.now()}-${Math.random()}@example.com`,
    },
  });

  const template = await prisma.recurringInvoice.create({
    data: {
      businessId,
      clientId: client.id,
      frequency: "MONTHLY",
      startDate: new Date("2026-01-01"),
      nextRunDate: overrides.nextRunDate ?? new Date(Date.now() - 1000), // due now, by default
      endDate: overrides.endDate,
      autoSend: overrides.autoSend ?? false,
      items: { create: [{ description: "Retainer", quantity: 1, unitPrice: 50_000_00 }] },
    },
  });

  return { client, template };
}

describe("generateDueRecurringInvoices", () => {
  it("generates a real invoice from a due template", async () => {
    const owner = await createAuthedUser();
    const { template, client } = await createClientAndTemplate(owner.businessId);

    const result = await generateDueRecurringInvoices();
    expect(result.generated).toBeGreaterThanOrEqual(1);

    const invoices = await prisma.invoice.findMany({ where: { recurringInvoiceId: template.id } });
    expect(invoices).toHaveLength(1);
    expect(invoices[0]!.clientId).toBe(client.id);
    expect(invoices[0]!.total).toBe(50_000_00);
    expect(invoices[0]!.status).toBe("DRAFT");
  });

  it("advances nextRunDate by one month after generating", async () => {
    const owner = await createAuthedUser();
    const dueDate = new Date("2026-01-01T00:00:00.000Z");
    const { template } = await createClientAndTemplate(owner.businessId, { nextRunDate: dueDate });

    await generateDueRecurringInvoices();

    const updated = await prisma.recurringInvoice.findUniqueOrThrow({ where: { id: template.id } });
    expect(updated.nextRunDate.toISOString()).toBe("2026-02-01T00:00:00.000Z");
  });

  it("auto-sends when the template has autoSend enabled", async () => {
    const owner = await createAuthedUser();
    const { template } = await createClientAndTemplate(owner.businessId, { autoSend: true });

    await generateDueRecurringInvoices();

    const invoice = await prisma.invoice.findFirstOrThrow({ where: { recurringInvoiceId: template.id } });
    expect(invoice.status).toBe("SENT");
  });

  it("deactivates the template once nextRunDate passes its endDate", async () => {
    const owner = await createAuthedUser();
    const { template } = await createClientAndTemplate(owner.businessId, {
      nextRunDate: new Date("2026-01-01T00:00:00.000Z"),
      endDate: new Date("2026-01-15T00:00:00.000Z"), // ends before the NEXT run would be due
    });

    await generateDueRecurringInvoices();

    const updated = await prisma.recurringInvoice.findUniqueOrThrow({ where: { id: template.id } });
    expect(updated.isActive).toBe(false);
  });

  it("does not generate anything for a template that isn't due yet", async () => {
    const owner = await createAuthedUser();
    const farFuture = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const { template } = await createClientAndTemplate(owner.businessId, { nextRunDate: farFuture });

    await generateDueRecurringInvoices();

    const invoices = await prisma.invoice.findMany({ where: { recurringInvoiceId: template.id } });
    expect(invoices).toHaveLength(0);
  });

  it("does not generate anything for an inactive template", async () => {
    const owner = await createAuthedUser();
    const { template } = await createClientAndTemplate(owner.businessId);
    await prisma.recurringInvoice.update({ where: { id: template.id }, data: { isActive: false } });

    await generateDueRecurringInvoices();

    const invoices = await prisma.invoice.findMany({ where: { recurringInvoiceId: template.id } });
    expect(invoices).toHaveLength(0);
  });
});