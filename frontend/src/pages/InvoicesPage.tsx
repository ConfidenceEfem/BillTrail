import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listInvoices, createInvoice, type CreateInvoicePayload } from "../api/invoices";
import { listClients } from "../api/clients";
import { Modal } from "../components/Modal";
import { InvoiceForm, type InvoiceFormValues } from "../components/InvoiceForm";
import { StatusBadge } from "../components/StatusBadge";
import { formatKobo } from "../lib/money";
import { getErrorMessage } from "../lib/error";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function InvoicesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: listInvoices,
  });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: listClients,
  });

  const createMutation = useMutation({
    mutationFn: (values: InvoiceFormValues) => {
      const payload: CreateInvoicePayload = {
        clientId: values.clientId,
        items: values.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: Math.round(item.unitPriceNaira * 100),
        })),
        taxRateBps: Math.round(values.taxRatePercent * 100),
        discountAmount: Math.round(values.discountNaira * 100),
        dueDate: values.dueDate,
      };
      return createInvoice(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setShowCreate(false);
       toast.success("Invoice created");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-gray-900">Invoices</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-800"
        >
          New invoice
        </button>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading...</p>}

      {invoices && invoices.length === 0 && (
        <p className="text-sm text-gray-500">No invoices yet. Create your first one above.</p>
      )}

      {invoices && invoices.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {invoices.map((invoice) => (
            <motion.div>
                <Link
              key={invoice.id}
              to={`/invoices/${invoice.id}`}
              className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{invoice.number}</p>
                <p className="text-xs text-gray-500">{invoice.client.name}</p>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <p className="text-sm font-medium">{formatKobo(invoice.total)}</p>
                <StatusBadge status={invoice.status} />
              </div>
            </Link>
            </motion.div>
          
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="New invoice" onClose={() => setShowCreate(false)}>
          <InvoiceForm
            clients={clients ?? []}
            isPending={createMutation.isPending}
            errorMessage={createMutation.isError ? getErrorMessage(createMutation.error) : undefined}
            onSubmit={(values) => createMutation.mutate(values)}
          />
        </Modal>
      )}
    </div>
  );
}