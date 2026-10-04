import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getPublicInvoice, payPublicInvoice } from "../api/public";
import { formatKobo } from "../lib/money";
import { getErrorMessage } from "../lib/error";

export function PublicInvoicePage() {
  const { token } = useParams<{ token: string }>();
  const [errorMessage, setErrorMessage] = useState<string>();

  const { data: invoice, isLoading, isError } = useQuery({
    queryKey: ["public-invoice", token],
    queryFn: () => getPublicInvoice(token!),
    enabled: !!token,
  });

  const payMutation = useMutation({
    mutationFn: () => payPublicInvoice(token!),
    onSuccess: (data) => {
      // A full browser redirect, not client-side routing — the client is
      // leaving BillTrail entirely to pay on Paystack's own hosted page.
      window.location.href = data.checkoutUrl;
    },
    onError: (error) => setErrorMessage(getErrorMessage(error)),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading invoice...</p>
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-sm text-red-600">This invoice could not be found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-6">
        <p className="text-xs text-gray-400 mb-1">Invoice {invoice.number}</p>
        <h1 className="text-lg font-medium text-gray-900 mb-1">{invoice.business.name}</h1>
        <p className="text-sm text-gray-500 mb-6">Billed to {invoice.client.name}</p>

        <div className="flex flex-col gap-2 mb-6">
          {invoice.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {item.description} &times; {item.quantity}
              </span>
              <span>{formatKobo(item.lineTotal)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-4 mb-6">
          <div className="flex justify-between text-2xl font-medium text-brand-800">
            <span>Total</span>
            <span>{formatKobo(invoice.total)}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Due {new Date(invoice.dueDate).toLocaleDateString("en-NG", { dateStyle: "long" })}
          </p>
        </div>

        {invoice.status === "PAID" && (
          <p className="bg-green-50 text-green-800 text-sm rounded-lg px-4 py-3 text-center font-medium">
            This invoice has been paid. Thank you.
          </p>
        )}

        {invoice.status === "CANCELLED" && (
          <p className="bg-gray-100 text-gray-600 text-sm rounded-lg px-4 py-3 text-center">
            This invoice has been cancelled.
          </p>
        )}

        {invoice.status === "SENT" && (
          <>
            {errorMessage && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{errorMessage}</p>
            )}
            <button
              onClick={() => payMutation.mutate()}
              disabled={payMutation.isPending}
              className="w-full bg-brand-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-brand-800 disabled:opacity-50"
            >
              {payMutation.isPending ? "Redirecting to payment..." : "Pay now"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}