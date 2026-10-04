import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getInvoice, sendInvoice, cancelInvoice } from "../api/invoices";
import { StatusBadge } from "../components/StatusBadge";
import { formatKobo } from "../lib/money";
import { getErrorMessage } from "../lib/error";
import { toast } from "sonner";

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: invoice, isLoading, isError } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => getInvoice(id!),
    enabled: !!id,
  });

  const sendMutation = useMutation({
    mutationFn: () => sendInvoice(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
       toast.success("Invoice sent to client");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelInvoice(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
        toast.success("Invoice cancelled");
    },
  });

  if (isLoading) return <p className="text-sm text-gray-500">Loading...</p>;
  if (isError || !invoice) return <p className="text-sm text-red-600">Invoice not found.</p>;

  const payUrl = `${window.location.origin}/pay/${invoice.publicToken}`;

  function copyLink() {
    navigator.clipboard.writeText(payUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-xl">
      <Link to="/invoices" className="text-sm text-gray-500 hover:text-gray-800 mb-4 inline-block">
        &larr; Back to invoices
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-lg font-medium text-gray-900">{invoice.number}</h1>
            <p className="text-sm text-gray-500">{invoice.client.name}</p>
          </div>
          <StatusBadge status={invoice.status} />
        </div>

        <div className="flex flex-col gap-2 mb-6">
          {invoice.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {item.description} &times; {item.quantity}
              </span>
              <span>{formatKobo(item.lineTotal)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-4 flex flex-col gap-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatKobo(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax</span>
            <span>{formatKobo(invoice.taxAmount)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Discount</span>
            <span>-{formatKobo(invoice.discountAmount)}</span>
          </div>
          <div className="flex justify-between font-medium text-gray-900 pt-2 border-t border-gray-100 mt-1 text-base">
            <span>Total</span>
            <span>{formatKobo(invoice.total)}</span>
          </div>
        </div>

        {invoice.status !== "DRAFT" && (
          <div className="mt-6 flex items-center gap-2">
            <input
              readOnly
              value={payUrl}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500"
            />
            <button
              onClick={copyLink}
              className="text-sm text-brand-600 font-medium px-3 py-2 whitespace-nowrap"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          {invoice.status === "DRAFT" && (
            <button
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending}
              className="bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-800 disabled:opacity-50"
            >
              {sendMutation.isPending ? "Sending..." : "Send to client"}
            </button>
          )}
          {invoice.status === "SENT" && (
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel invoice"}
            </button>
          )}
        </div>

        {(sendMutation.isError || cancelMutation.isError) && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-4">
            {getErrorMessage(sendMutation.error ?? cancelMutation.error)}
          </p>
        )}
      </div>
    </div>
  );
}