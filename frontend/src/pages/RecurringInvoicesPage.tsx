import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listRecurringInvoices,
  createRecurringInvoice,
  updateRecurringInvoice,
  type RecurringInvoice,
} from "../api/recurringInvoices";
import { listClients } from "../api/clients";
import { Modal } from "../components/Modal";
import { RecurringInvoiceForm, type RecurringFormValues } from "../components/RecurringInvoiceForm";
import { formatKobo } from "../lib/money";
import { getErrorMessage } from "../lib/error";

function frequencyLabel(freq: string) {
  return freq === "WEEKLY" ? "Weekly" : "Monthly";
}

export function RecurringInvoicesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["recurring-invoices"],
    queryFn: listRecurringInvoices,
  });

  const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: listClients });

  const createMutation = useMutation({
    mutationFn: (values: RecurringFormValues) =>
      createRecurringInvoice({
        clientId: values.clientId,
        items: values.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: Math.round(item.unitPriceNaira * 100),
        })),
        taxRateBps: 0,
        discountAmount: 0,
        frequency: values.frequency,
        startDate: values.startDate,
        endDate: values.endDate || undefined,
        autoSend: values.autoSend,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-invoices"] });
      setShowCreate(false);
      toast.success("Recurring invoice created");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateRecurringInvoice(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-invoices"] });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-gray-900">Recurring invoices</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-800"
        >
          New recurring invoice
        </button>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading...</p>}

      {templates && templates.length === 0 && (
        <p className="text-sm text-gray-500">No recurring invoices yet.</p>
      )}

      {templates && templates.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {templates.map((template: RecurringInvoice) => {
            const total = template.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
            return (
              <div
                key={template.id}
                className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{template.client.name}</p>
                  <p className="text-xs text-gray-500">
                    {frequencyLabel(template.frequency)} &middot; {formatKobo(total)} &middot; next{" "}
                    {new Date(template.nextRunDate).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-500">
                  <input
                    type="checkbox"
                    checked={template.isActive}
                    onChange={(e) =>
                      toggleMutation.mutate({ id: template.id, isActive: e.target.checked })
                    }
                    className="rounded"
                  />
                  Active
                </label>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <Modal title="New recurring invoice" onClose={() => setShowCreate(false)}>
          <RecurringInvoiceForm
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