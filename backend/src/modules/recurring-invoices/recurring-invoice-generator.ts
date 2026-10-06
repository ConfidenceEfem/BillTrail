import { prisma } from "../../lib/prisma";
import { logger } from "../../config/logger";
import { advanceByFrequency } from "./recurring-date-math";
import { createInvoice } from "../invoices/invoices.service";
import { sendInvoice } from "../invoices/invoices.service";

const DEFAULT_DUE_DAYS = 14;

export async function generateDueRecurringInvoices() {
  const now = new Date();

  const dueTemplates = await prisma.recurringInvoice.findMany({
    where: { isActive: true, nextRunDate: { lte: now } },
    include: { items: true },
  });

  logger.info({ count: dueTemplates.length }, "Checking recurring invoice templates");

  let generated = 0;

  for (const template of dueTemplates) {
    try {
      const dueDate = new Date(now.getTime() + DEFAULT_DUE_DAYS * 24 * 60 * 60 * 1000);

      const invoice = await createInvoice(template.businessId, {
        clientId: template.clientId,
        items: template.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        taxRateBps: template.taxRateBps,
        discountAmount: template.discountAmount,
        dueDate,
        notes: template.notes ?? undefined,
      });

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { recurringInvoiceId: template.id },
      });

      if (template.autoSend) {
        await sendInvoice(template.businessId, invoice.id);
      }

      const nextRunDate = advanceByFrequency(template.nextRunDate, template.frequency);
      const hasEnded = template.endDate !== null && nextRunDate > template.endDate;

      await prisma.recurringInvoice.update({
        where: { id: template.id },
        data: { nextRunDate, isActive: !hasEnded },
      });

      generated++;
    } catch (err) {
      logger.error({ err, templateId: template.id }, "Failed to generate recurring invoice");
    }
  }

  return { checked: dueTemplates.length, generated };
}