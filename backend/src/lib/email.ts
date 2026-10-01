import { Resend } from "resend";
import { env, isProduction } from "../config/env";
import { logger } from "../config/logger";

const resend = new Resend(env.RESEND_API_KEY);

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

/**
 * The ONE place the app sends email. Every other file calls this function —
 * none of them know or care whether the underlying provider is Resend,
 * something else, or (in tests) nothing at all.
 */
export async function sendEmail(input: SendEmailInput) {
  if (env.NODE_ENV === "test") {
    // Never make a real network call to a real email provider during
    // automated tests — that would be slow, flaky (depends on Resend being
    // up), and could genuinely spam a real inbox on every test run.
    logger.info({ to: input.to, subject: input.subject }, "Email suppressed in test environment");
    return;
  }

  const result = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  if (result.error) {
    logger.error({ err: result.error, to: input.to }, "Failed to send email");
    if (isProduction) return;
    throw new Error(`Failed to send email: ${result.error.message}`);
  }
}