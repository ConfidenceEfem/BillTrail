import { prisma } from "../../lib/prisma";
import { sendEmail } from "../../lib/email";
import { overdueReminderEmailHtml } from "../../lib/email-templates";
import { formatKobo } from "../../lib/money";
import { logger } from "../../config/logger";
import { env } from "../../config/env";

const REMINDER_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // don't remind more than once every 3 days

export async function sendOverdueReminders() {
  const now = new Date();
  const cooldownCutoff = new Date(now.getTime() - REMINDER_COOLDOWN_MS);

  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: "SENT",
      dueDate: { lt: now },
      OR: [{ lastReminderSentAt: null }, { lastReminderSentAt: { lt: cooldownCutoff } }],
    },
    include: {
      client: { select: { name: true, email: true } },
      business: { select: { name: true } },
    },
  });

  logger.info({ count: overdueInvoices.length }, "Checking overdue invoices for reminders");

  for (const invoice of overdueInvoices) {
    try {
      const payUrl = `${env.FRONTEND_URL}/pay/${invoice.publicToken}`;
      await sendEmail({
        to: invoice.client.email,
        subject: `Reminder: Invoice ${invoice.number} is overdue`,
        html: overdueReminderEmailHtml({
          businessName: invoice.business.name,
          invoiceNumber: invoice.number,
          totalFormatted: formatKobo(invoice.total, invoice.currency),
          dueDateFormatted: invoice.dueDate.toLocaleDateString("en-NG", { dateStyle: "long" }),
          payUrl,
        }),
      });

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { lastReminderSentAt: now },
      });
    } catch (err) {
 
      logger.error({ err, invoiceId: invoice.id }, "Failed to send overdue reminder");
    }
  }

  return { checked: overdueInvoices.length };
}