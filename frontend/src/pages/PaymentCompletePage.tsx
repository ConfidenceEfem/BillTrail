import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPublicInvoice } from "../api/public";

export function PaymentCompletePage() {
  const { token } = useParams<{ token: string }>();

  const { data: invoice, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["public-invoice", token],
    queryFn: () => getPublicInvoice(token!),
    enabled: !!token,
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 p-8 text-center">
        {isLoading && <p className="text-sm text-gray-500">Checking payment status...</p>}

        {invoice && invoice.status === "PAID" && (
          <>
            <h1 className="text-xl font-medium text-brand-800 mb-2">Payment received</h1>
            <p className="text-sm text-gray-600">Thank you — this invoice is now marked as paid.</p>
          </>
        )}

        {invoice && invoice.status !== "PAID" && (
          <>
            <h1 className="text-xl font-medium text-gray-900 mb-2">Still confirming...</h1>
            <p className="text-sm text-gray-600 mb-4">
              Your payment is being confirmed. This usually takes a few seconds.
            </p>
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="text-sm text-brand-600 font-medium"
            >
              {isRefetching ? "Checking..." : "Check again"}
            </button>
          </>
        )}

        {token && (
          <Link to={`/pay/${token}`} className="block text-xs text-gray-400 mt-6">
            Back to invoice
          </Link>
        )}
      </div>
    </div>
  );
}