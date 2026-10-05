import { api } from "../lib/api";

export type Business = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  currency: string;
};

export type UpdateBusinessPayload = { name?: string; phone?: string; address?: string };

export async function getBusiness() {
  const { data } = await api.get("/business/me");
  return data.data as Business;
}

export async function updateBusiness(payload: UpdateBusinessPayload) {
  const { data } = await api.patch("/business/me", payload);
  return data.data as Business;
}