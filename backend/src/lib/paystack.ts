import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../config/env";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

type InitializeTransactionResponse = {
  status: boolean;
  message: string;
  data: { authorization_url: string; access_code: string; reference: string };
};

export async function initializePaystackTransaction(params: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
}) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      callback_url: params.callbackUrl,
    }),
  });

  const body = (await res.json()) as InitializeTransactionResponse;

  if (!res.ok || !body.status) {
    throw new Error(`Paystack initialize failed: ${body.message ?? res.statusText}`);
  }

  return body.data;
}

export function verifyPaystackSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  if (!signatureHeader) return false;

  const expected = createHmac("sha512", env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(signatureHeader, "hex");

  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

type Bank = { name: string; code: string };

export async function listBanks(): Promise<Bank[]> {
  const res = await fetch(`${PAYSTACK_BASE_URL}/bank?country=nigeria`, {
    headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` },
  });
  const body = (await res.json()) as { status: boolean; data: Array<{ name: string; code: string }> };
  if (!res.ok || !body.status) {
    throw new Error("Failed to fetch bank list from Paystack");
  }
  return body.data.map((b) => ({ name: b.name, code: b.code }));
}

type ResolvedAccount = { account_number: string; account_name: string };

export async function resolveBankAccount(accountNumber: string, bankCode: string): Promise<ResolvedAccount> {
  const res = await fetch(
    `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    { headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` } },
  );
  const body = (await res.json()) as { status: boolean; message: string; data: ResolvedAccount };
  if (!res.ok || !body.status) {
    throw new Error(body.message || "Could not verify this account number");
  }
  return body.data;
}

type TransferRecipientResponse = { status: boolean; data: { recipient_code: string } };


export async function createTransferRecipient(params: {
  accountNumber: string;
  bankCode: string;
  accountName: string;
}) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "nuban",
      name: params.accountName,
      account_number: params.accountNumber,
      bank_code: params.bankCode,
      currency: "NGN",
    }),
  });
  const body = (await res.json()) as TransferRecipientResponse & { message?: string };
  if (!res.ok || !body.status) {
    throw new Error(body.message || "Failed to create transfer recipient");
  }
  return body.data.recipient_code;
}

type InitiateTransferResponse = {
  status: boolean;
  message: string;
  data: { transfer_code: string; status: string };
};


export async function initiateTransfer(params: {
  amountKobo: number;
  recipientCode: string;
  reference: string;
  reason: string;
}) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: "balance",
      amount: params.amountKobo,
      recipient: params.recipientCode,
      reference: params.reference,
      reason: params.reason,
    }),
  });
  const body = (await res.json()) as InitiateTransferResponse;
  if (!res.ok || !body.status) {
    throw new Error(body.message || "Failed to initiate transfer");
  }
  return body.data;
}