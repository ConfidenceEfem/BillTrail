import cron from "node-cron";
import { sendOverdueReminders } from "../modules/invoices/overdue-reminders";
import { logger } from "../config/logger";
import { generateDueRecurringInvoices } from "../modules/recurring-invoices/recurring-invoice-generator";

export function startScheduledJobs() {
  // Runs once a day at 08:00 server time.
  cron.schedule("0 8 * * *", async () => {
    logger.info("Running scheduled overdue-reminder check");
    try {
      const result = await sendOverdueReminders();
      logger.info({ result }, "Overdue-reminder check complete");
    } catch (err) {
      logger.error({ err }, "Overdue-reminder check failed");
    }
  });

  cron.schedule("0 6 * * *", async () => {
    logger.info("Running scheduled recurring-invoice generation");
    try {
      const result = await generateDueRecurringInvoices();
      logger.info({ result }, "Recurring-invoice generation complete");
    } catch (err) {
      logger.error({ err }, "Recurring-invoice generation failed");
    }
  });

  logger.info("Scheduled jobs started (recurring invoices: daily at 06:00, overdue reminders: daily at 08:00)");
}