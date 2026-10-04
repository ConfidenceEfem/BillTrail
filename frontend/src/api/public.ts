import { api } from "../lib/api";

export type PublicInvoice = {
  number: string;
  status: "SENT" | "PAID" | "CANCELLED";
  total: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  dueDate: string;
  items: Array<{ description: string; quantity: number; unitPrice: number; lineTotal: number }>;
  business: { name: string; phone: string | null };
  client: { name: string };
};

export async function getPublicInvoice(token: string) {
  const { data } = await api.get(`/public/invoices/${token}`);
  return data.data as PublicInvoice;
}

export async function payPublicInvoice(token: string) {
  const { data } = await api.get(`/public/invoices/${token}`); // ensure still payable before redirecting
  void data;
  const res = await api.post(`/public/invoices/${token}/pay`);
  return res.data.data as { checkoutUrl: string };
}