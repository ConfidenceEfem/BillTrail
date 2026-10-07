import { prisma } from "../src/lib/prisma";
import { login, registerBusiness, verifyEmail } from "../src/modules/auth/auth.service";

export function uniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}


export async function createAuthedUser(businessName = "Test Business") {
  const email = uniqueEmail();
  const password = "supersecret123";

  const { user, verificationToken } = await registerBusiness({ businessName, email, password });
  await verifyEmail(verificationToken);
  const { accessToken } = await login(email, password);

  return {
    email,
    businessId: user.business!.id,
    authHeader: `Bearer ${accessToken}`,
  };
}

export async function createPaidInvoiceFor(businessId: string, amountKobo: number) {
  const client = await prisma.client.create({
    data: { businessId, name: "Balance Test Client", email: `bal-${Date.now()}-${Math.random()}@example.com` },
  });
  const invoice = await prisma.invoice.create({
    data: {
      businessId,
      clientId: client.id,
      number: `INV-BAL-${Date.now()}`,
      subtotal: amountKobo,
      total: amountKobo,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "PAID",
      amountPaid: amountKobo,
      paidAt: new Date(),
    },
  });
  await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      amount: amountKobo,
      currency: "NGN",
      status: "SUCCESS",
      reference: `paid_${Date.now()}_${Math.random()}`,
      paidAt: new Date(),
    },
  });
  return invoice;
}