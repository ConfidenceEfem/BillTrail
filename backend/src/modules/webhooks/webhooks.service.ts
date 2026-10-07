import { prisma } from "../../lib/prisma";

type PaystackEvent = {
  event: string;
  data: { reference: string; amount: number; status: string };
};

export async function processPaystackEvent(eventId: string, payload: PaystackEvent) {
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

  if (payload.event === "transfer.success" || payload.event === "transfer.failed") {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { paystackReference: payload.data.reference },
    });

    if (!withdrawal) {
      return { alreadyProcessed: false, handled: false };
    }

    await prisma.withdrawal.update({
      where: { id: withdrawal.id },
      data:
        payload.event === "transfer.success"
          ? { status: "SUCCESS", completedAt: new Date() }
          : { status: "FAILED", failureReason: "Transfer failed at Paystack" },
    });

    return { alreadyProcessed: false, handled: true };
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