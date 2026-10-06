import { api } from "../lib/api";

export type RecurringFrequency = "WEEKLY" | "MONTHLY";

export type RecurringInvoice = {
  id: string;
  frequency: RecurringFrequency;
  nextRunDate: string;
  endDate: string | null;
  autoSend: boolean;
  isActive: boolean;
  items: Array<{ description: string; quantity: number; unitPrice: number }>;
  client: { id: string; name: string };
};

export type CreateRecurringInvoicePayload = {
  clientId: string;
  items: Array<{ description: string; quantity: number; unitPrice: number }>;
  taxRateBps: number;
  discountAmount: number;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
  autoSend: boolean;
};

export async function listRecurringInvoices() {
  const { data } = await api.get("/recurring-invoices");
  return data.data as RecurringInvoice[];
}

export async function createRecurringInvoice(payload: CreateRecurringInvoicePayload) {
  const { data } = await api.post("/recurring-invoices", payload);
  return data.data as RecurringInvoice;
}

export async function updateRecurringInvoice(
  id: string,
  payload: Partial<{ isActive: boolean; autoSend: boolean; endDate: string | null }>,
) {
  const { data } = await api.patch(`/recurring-invoices/${id}`, payload);
  return data.data as RecurringInvoice;
}

export async function deleteRecurringInvoice(id: string) {
  await api.delete(`/recurring-invoices/${id}`);
}