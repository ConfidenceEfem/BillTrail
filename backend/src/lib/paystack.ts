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