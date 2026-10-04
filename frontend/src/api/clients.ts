import { api } from "../lib/api";

export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
};

export type ClientPayload = { name: string; email: string; phone?: string };

export async function listClients() {
  const { data } = await api.get("/clients", { params: { pageSize: 100 } });
  return data.data as Client[];
}

export async function createClient(payload: ClientPayload) {
  const { data } = await api.post("/clients", payload);
  return data.data as Client;
}

export async function updateClient(id: string, payload: Partial<ClientPayload>) {
  const { data } = await api.patch(`/clients/${id}`, payload);
  return data.data as Client;
}

export async function deleteClient(id: string) {
  await api.delete(`/clients/${id}`);
}