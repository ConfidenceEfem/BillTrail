import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";
import type {
  CreateRecurringInvoiceInput,
  UpdateRecurringInvoiceInput,
} from "./recurring-invoices.validation";

export async function createRecurringInvoice(businessId: string, input: CreateRecurringInvoiceInput) {
  const client = await prisma.client.findFirst({
    where: { id: input.clientId, businessId, deletedAt: null },
  });
  if (!client) throw new NotFoundError("Client not found");

  return prisma.recurringInvoice.create({
    data: {
      businessId,
      clientId: input.clientId,
      frequency: input.frequency,
      taxRateBps: input.taxRateBps,
      discountAmount: input.discountAmount,
      startDate: input.startDate,
      nextRunDate: input.startDate, 
      endDate: input.endDate,
      autoSend: input.autoSend,
      notes: input.notes,
      items: { create: input.items },
    },
    include: { items: true, client: { select: { id: true, name: true } } },
  });
}

export async function listRecurringInvoices(businessId: string) {
  return prisma.recurringInvoice.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    include: { items: true, client: { select: { id: true, name: true } } },
  });
}

async function getOwnedOrThrow(businessId: string, id: string) {
  const template = await prisma.recurringInvoice.findFirst({
    where: { id, businessId },
    include: { items: true, client: { select: { id: true, name: true } } },
  });
  if (!template) throw new NotFoundError("Recurring invoice not found");
  return template;
}

export async function getRecurringInvoice(businessId: string, id: string) {
  return getOwnedOrThrow(businessId, id);
}

export async function updateRecurringInvoice(
  businessId: string,
  id: string,
  input: UpdateRecurringInvoiceInput,
) {
  await getOwnedOrThrow(businessId, id);
  return prisma.recurringInvoice.update({
    where: { id },
    data: input,
    include: { items: true, client: { select: { id: true, name: true } } },
  });
}

export async function deleteRecurringInvoice(businessId: string, id: string) {
  const template = await getOwnedOrThrow(businessId, id);
  const generatedCount = await prisma.invoice.count({ where: { recurringInvoiceId: template.id } });

  if (generatedCount > 0) {
    
    return prisma.recurringInvoice.update({ where: { id }, data: { isActive: false } });
  }

  await prisma.$transaction([
    prisma.recurringInvoiceItem.deleteMany({ where: { recurringInvoiceId: id } }),
    prisma.recurringInvoice.delete({ where: { id } }),
  ]);
}