import { api } from "../lib/api";

export type Bank = { name: string; code: string };
export type ResolvedAccount = { account_number: string; account_name: string };

export type BankAccount = {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
};

export type Withdrawal = {
  id: string;
  amount: number;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
  createdAt: string;
  failureReason: string | null;
  bankAccount: { bankName: string; accountNumber: string; accountName: string };
};

export async function getBanks() {
  const { data } = await api.get("/bank-accounts/banks");
  return data.data as Bank[];
}

export async function previewBankAccount(accountNumber: string, bankCode: string) {
  const { data } = await api.post("/bank-accounts/preview", { accountNumber, bankCode });
  return data.data as ResolvedAccount;
}

export async function saveBankAccount(payload: { accountNumber: string; bankCode: string; bankName: string }) {
  const { data } = await api.post("/bank-accounts", payload);
  return data.data as BankAccount;
}

export async function listBankAccounts() {
  const { data } = await api.get("/bank-accounts");
  return data.data as BankAccount[];
}

export async function deleteBankAccount(id: string) {
  await api.delete(`/bank-accounts/${id}`);
}

export async function getBalance() {
  const { data } = await api.get("/withdrawals/balance");
  return data.data as { availableBalance: number };
}

export async function requestWithdrawal(payload: { bankAccountId: string; amountNaira: number }) {
  const { data } = await api.post("/withdrawals", payload);
  return data.data as Withdrawal;
}

export async function listWithdrawals() {
  const { data } = await api.get("/withdrawals");
  return data.data as Withdrawal[];
}