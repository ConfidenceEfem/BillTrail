import { prisma } from "../../lib/prisma";
import { BadRequestError, ConflictError, NotFoundError } from "../../lib/errors";
import { calculateInvoiceTotals } from "./invoice-math";
import type { CreateInvoiceInput, ListInvoicesQuery, UpdateInvoiceInput } from "./invoices.validation";
import { generateInvoicePdf } from "../../lib/invoice-pdf";


const MAX_NUMBER_RETRIES = 5;


async function createInvoiceWithNumber(
  businessId: string,
  buildData: (number: string) => Parameters<typeof prisma.invoice.create>[0]["data"],
) {
  for (let attempt = 0; attempt < MAX_NUMBER_RETRIES; attempt++) {
    const count = await prisma.invoice.count({ where: { businessId } });
    const number = `INV-${String(count + 1 + attempt).padStart(4, "0")}`;

    try {
      return await prisma.invoice.create({ data: buildData(number), include: { items: true } });
    } catch (err) {

      const isUniqueConflict =
        typeof err === "object" && err !== null && "code" in err && err.code === "P2002";
      if (!isUniqueConflict) throw err;
    }
  }
  throw new ConflictError("Could not generate a unique invoice number, please try again");
}

export async function createInvoice(businessId: string, input: CreateInvoiceInput) {
  const client = await prisma.client.findFirst({
    where: { id: input.clientId, businessId, deletedAt: null },
  });
  if (!client) {

    throw new NotFoundError("Client not found");
  }

  const totals = calculateInvoiceTotals(input.items, input.taxRateBps, input.discountAmount);

  return createInvoiceWithNumber(businessId, (number) => ({
    businessId,
    clientId: input.clientId,
    number,
    currency: "NGN",
    subtotal: totals.subtotal,
    taxRateBps: input.taxRateBps,
    taxAmount: totals.taxAmount,
    discountAmount: totals.discountAmount,
    total: totals.total,
    issueDate: new Date(),
    dueDate: input.dueDate,
    notes: input.notes,
    items: { create: totals.items },
  }));
}

export async function listInvoices(businessId: string, query: ListInvoicesQuery) {
  const where = {
    businessId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.clientId ? { clientId: query.clientId } : {}),
  };

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { client: { select: { id: true, name: true } } },
    }),
    prisma.invoice.count({ where }),
  ]);

  return { invoices, total, page: query.page, pageSize: query.pageSize };
}

async function getOwnedInvoiceOrThrow(businessId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, businessId },
    include: { items: true, client: { select: { id: true, name: true, email: true } } },
  });
  if (!invoice) {
    throw new NotFoundError("Invoice not found");
  }
  return invoice;
}

export async function getInvoice(businessId: string, invoiceId: string) {
  return getOwnedInvoiceOrThrow(businessId, invoiceId);
}

export async function updateInvoice(businessId: string, invoiceId: string, input: UpdateInvoiceInput) {
  const invoice = await getOwnedInvoiceOrThrow(businessId, invoiceId);

  if (invoice.status !== "DRAFT") {
    throw new BadRequestError(`Cannot edit an invoice with status ${invoice.status}`);
  }

  const clientId = input.clientId ?? invoice.clientId;
  if (input.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: input.clientId, businessId, deletedAt: null },
    });
    if (!client) throw new NotFoundError("Client not found");
  }

  const items = input.items ?? invoice.items.map((i) => ({
    description: i.description,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
  }));
  const taxRateBps = input.taxRateBps ?? invoice.taxRateBps;
  const discountAmount = input.discountAmount ?? invoice.discountAmount;
  const totals = calculateInvoiceTotals(items, taxRateBps, discountAmount);

  return prisma.$transaction(async (tx) => {
    await tx.invoiceItem.deleteMany({ where: { invoiceId } });
    return tx.invoice.update({
      where: { id: invoiceId },
      data: {
        clientId,
        taxRateBps,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        discountAmount: totals.discountAmount,
        total: totals.total,
        dueDate: input.dueDate ?? invoice.dueDate,
        notes: input.notes ?? invoice.notes,
        items: { create: totals.items },
      },
      include: { items: true },
    });
  });
}

export async function deleteInvoice(businessId: string, invoiceId: string) {
  const invoice = await getOwnedInvoiceOrThrow(businessId, invoiceId);

  if (invoice.status !== "DRAFT") {
    throw new BadRequestError(`Cannot delete an invoice with status ${invoice.status}`);
  }

  await prisma.$transaction([
    prisma.invoiceItem.deleteMany({ where: { invoiceId } }),
    prisma.invoice.delete({ where: { id: invoiceId } }),
  ]);
}

export async function sendInvoice(businessId: string, invoiceId: string) {
  const invoice = await getOwnedInvoiceOrThrow(businessId, invoiceId);

  if (invoice.status !== "DRAFT") {
    throw new BadRequestError(`Cannot send an invoice with status ${invoice.status}`);
  }

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "SENT", sentAt: new Date() },
    include: { items: true, client: { select: { id: true, name: true, email: true } } },
  });
}

export async function cancelInvoice(businessId: string, invoiceId: string) {
  const invoice = await getOwnedInvoiceOrThrow(businessId, invoiceId);

  if (invoice.status !== "SENT") {
    throw new BadRequestError(`Cannot cancel an invoice with status ${invoice.status}`);
  }

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "CANCELLED", cancelledAt: new Date() },
    include: { items: true, client: { select: { id: true, name: true, email: true } } },
  });
}



export async function getInvoicePdf(businessId: string, invoiceId: string) {
  const invoice = await getOwnedInvoiceOrThrow(businessId, invoiceId);
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { name: true, phone: true, address: true },
  });

  return generateInvoicePdf({
    number: invoice.number,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    status: invoice.status,
    currency: invoice.currency,
    subtotal: invoice.subtotal,
    taxAmount: invoice.taxAmount,
    discountAmount: invoice.discountAmount,
    total: invoice.total,
    notes: invoice.notes,
    business,
    client: { name: invoice.client.name, email: invoice.client.email },
    items: invoice.items,
  });
}