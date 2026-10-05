import { prisma } from "../../lib/prisma";
import { BadRequestError, NotFoundError } from "../../lib/errors";
import { initializePaystackTransaction } from "../../lib/paystack";
import { env } from "../../config/env";
import { randomUUID } from "node:crypto";
import { generateInvoicePdf } from "../../lib/invoice-pdf";


export async function getInvoiceByPublicToken(token: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { publicToken: token },
    include: {
      items: true,
      business: { select: { name: true, phone: true, currency: true } },
      client: { select: { name: true, email: true } },
    },
  });


  if (!invoice || invoice.status === "DRAFT") {
    throw new NotFoundError("Invoice not found");
  }


  if (!invoice.viewedAt) {
    await prisma.invoice.update({ where: { id: invoice.id }, data: { viewedAt: new Date() } });
  }

  return invoice;
}


export async function initiateInvoicePayment(token: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { publicToken: token },
    include: { client: { select: { email: true } } },
  });

  if (!invoice || invoice.status === "DRAFT") {
    throw new NotFoundError("Invoice not found");
  }

  if (invoice.status === "PAID") {
    throw new BadRequestError("This invoice has already been paid");
  }
  if (invoice.status === "CANCELLED") {
    throw new BadRequestError("This invoice has been cancelled");
  }

  const reference = `btl_${randomUUID()}`;

  await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      amount: invoice.total,
      currency: invoice.currency,
      status: "PENDING",
      reference,
    },
  });

  const { authorization_url } = await initializePaystackTransaction({
    email: invoice.client.email,
    amountKobo: invoice.total,
    reference,
    callbackUrl: `${env.FRONTEND_URL}/pay/${token}/complete`,
  });

  return { checkoutUrl: authorization_url };
}


export async function getPublicInvoicePdf(token: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { publicToken: token },
    include: { items: true, business: { select: { name: true, phone: true, address: true } }, client: { select: { name: true, email: true } } },
  });

  if (!invoice || invoice.status === "DRAFT") {
    throw new NotFoundError("Invoice not found");
  }

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
    business: invoice.business,
    client: invoice.client,
    items: invoice.items,
  });
}