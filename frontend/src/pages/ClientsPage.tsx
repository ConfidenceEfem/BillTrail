import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listClients, createClient, updateClient, type Client } from "../api/clients";
import { Modal } from "../components/Modal";
import { ClientForm, type ClientFormValues } from "../components/ClientForm";
import { getErrorMessage } from "../lib/error";
import { toast } from "sonner"
import { motion } from "framer-motion";



export function ClientsPage() {
  const queryClient = useQueryClient();
  const [modalMode, setModalMode] = useState<"none" | "create" | "edit">("none");
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: listClients,
  });

  const createMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setModalMode("none");
        toast.success("Client created");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<ClientFormValues> }) =>
      updateClient(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setModalMode("none");
      setEditingClient(null);
      toast.success("Client updated");

    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-gray-900">Clients</h1>
        <button
          onClick={() => setModalMode("create")}
          className="bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-800"
        >
          New client
        </button>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading...</p>}

      {clients && clients.length === 0 && (
        <p className="text-sm text-gray-500">No clients yet. Add your first one above.</p>
      )}

      {clients && clients.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {clients.map((client) => (
            <motion.div
              key={client.id}
              className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{client.name}</p>
                <p className="text-xs text-gray-500">{client.email}</p>
              </div>
              <button
                onClick={() => {
                  setEditingClient(client);
                  setModalMode("edit");
                }}
                className="text-sm text-brand-600 font-medium"
              >
                Edit
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {modalMode === "create" && (
        <Modal title="New client" onClose={() => setModalMode("none")}>
          <ClientForm
            submitLabel="Create client"
            isPending={createMutation.isPending}
            errorMessage={createMutation.isError ? getErrorMessage(createMutation.error) : undefined}
            onSubmit={(values) => createMutation.mutate(values)}
          />
        </Modal>
      )}

      {modalMode === "edit" && editingClient && (
        <Modal title="Edit client" onClose={() => setModalMode("none")}>
          <ClientForm
            defaultValues={editingClient}
            submitLabel="Save changes"
            isPending={updateMutation.isPending}
            errorMessage={updateMutation.isError ? getErrorMessage(updateMutation.error) : undefined}
            onSubmit={(values) => updateMutation.mutate({ id: editingClient.id, values })}
          />
        </Modal>
      )}
    </div>
  );
}