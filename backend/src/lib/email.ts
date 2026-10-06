import { env, isProduction } from "../config/env";
import { logger } from "../config/logger";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};


export async function sendEmail(input: SendEmailInput) {
  if (env.NODE_ENV === "test") {
    logger.info({ to: input.to, subject: input.subject }, "Email suppressed in test environment");
    return;
  }

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: env.EMAIL_FROM_NAME, email: env.EMAIL_FROM_ADDRESS },
      to: [{ email: input.to }],
      subject: input.subject,
      htmlContent: input.html,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    logger.error({ status: res.status, body: errorBody, to: input.to }, "Failed to send email");
    if (isProduction) return;
    throw new Error(`Failed to send email: ${res.status} ${errorBody}`);
  }
}