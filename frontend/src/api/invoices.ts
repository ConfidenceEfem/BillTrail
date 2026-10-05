import { api } from "../lib/api";
import { triggerBrowserDownload } from "../lib/download";

export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "CANCELLED";

export type InvoiceListItem = {
  id: string;
  number: string;
  status: InvoiceStatus;
  total: number;
  dueDate: string;
  client: { id: string; name: string };
};

export type InvoiceItemInput = { description: string; quantity: number; unitPrice: number };

export type CreateInvoicePayload = {
  clientId: string;
  items: InvoiceItemInput[];
  taxRateBps: number;
  discountAmount: number;
  dueDate: string;
};

export type InvoiceDetail = InvoiceListItem & {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  publicToken: string;
  items: Array<InvoiceItemInput & { id: string; lineTotal: number }>;
  client: { id: string; name: string; email: string };
};

export async function listInvoices() {
  const { data } = await api.get("/invoices", { params: { pageSize: 100 } });
  return data.data as InvoiceListItem[];
}

export async function getInvoice(id: string) {
  const { data } = await api.get(`/invoices/${id}`);
  return data.data as InvoiceDetail;
}

export async function createInvoice(payload: CreateInvoicePayload) {
  const { data } = await api.post("/invoices", payload);
  return data.data as InvoiceDetail;
}

export async function sendInvoice(id: string) {
  const { data } = await api.post(`/invoices/${id}/send`);
  return data.data as InvoiceDetail;
}

export async function cancelInvoice(id: string) {
  const { data } = await api.post(`/invoices/${id}/cancel`);
  return data.data as InvoiceDetail;
}

export async function downloadInvoicePdf(id: string, invoiceNumber: string) {
  const response = await api.get(`/invoices/${id}/pdf`, { responseType: "blob" });
  triggerBrowserDownload(response.data, `${invoiceNumber}.pdf`);
}