import {api} from "../lib/api"

type loginPayloadType = {
    email: string,
    password: string
}

export const login = async (loginPayload: loginPayloadType) => {
    const {data} = await api.post("/auth/login", loginPayload)

    return data.data as {accessToken: string, refreshToken: string}
}

type registerPayloadType = {
    businessName: string,
    email: string,
    password: string, 
}

export const registerBusiness = async (registerPayload: registerPayloadType) => {
   const {data} = await api.post("/auth/register", registerPayload)
   return data?.data
}

export async function verifyEmail(token: string) {
  const { data } = await api.get("/auth/verify-email", { params: { token } });
  return data.data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data.data;
}

export async function resetPassword(payload: { token: string; newPassword: string }) {
  const { data } = await api.post("/auth/reset-password", payload);
  return data.data;
}


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