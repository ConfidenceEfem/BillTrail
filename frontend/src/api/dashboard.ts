import { api } from "../lib/api";

export type DashboardSummary = {
  totalRevenue: number;
  outstanding: number;
  overdueAmount: number;
  overdueCount: number;
};

export async function getDashboardSummary() {
  const { data } = await api.get("/dashboard/summary");
  return data.data as DashboardSummary;
}