import type { InvoiceStatus } from "../api/invoices";

const styles: Record<InvoiceStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-amber-100 text-amber-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status]}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}