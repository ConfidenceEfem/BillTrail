import { prisma } from "../../lib/prisma";

type PaystackChargeSuccessEvent = {
  event: string;
  data: { reference: string; amount: number; status: string };
};

export async function processPaystackEvent(eventId: string, payload: PaystackChargeSuccessEvent) {
  try {
    await prisma.webhookEvent.create({
      data: { provider: "paystack", eventId, type: payload.event, payload: payload as object },
    });
  } catch (err) {
    const isDuplicate =
      typeof err === "object" && err !== null && "code" in err && err.code === "P2002";
    if (isDuplicate) {
      return { alreadyProcessed: true };
    }
    throw err;
  }

  if (payload.event !== "charge.success") {
    return { alreadyProcessed: false, handled: false };
  }

  const payment = await prisma.payment.findUnique({
    where: { reference: payload.data.reference },
    include: { invoice: true },
  });

  if (!payment) {
    return { alreadyProcessed: false, handled: false };
  }

  const amountMatches = payload.data.amount === payment.amount;
  const alreadySucceeded = payment.status === "SUCCESS";

  if (!amountMatches || alreadySucceeded) {
    return { alreadyProcessed: false, handled: false, amountMismatch: !amountMatches };
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCESS",
        providerTransactionId: payload.data.reference,
        paidAt: new Date(),
      },
    }),
    prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: { status: "PAID", paidAt: new Date() },
    }),
  ]);

  return { alreadyProcessed: false, handled: true };
}