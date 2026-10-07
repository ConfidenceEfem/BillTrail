import type { RequestHandler } from "express";
import { resolveAccountSchema, saveBankAccountSchema, bankAccountIdParamSchema } from "./withdrawals.validation";
import { previewBankAccount, addBankAccount, listBankAccounts, deleteBankAccount } from "./bank-accounts.service";
import { listBanks } from "../../lib/paystack";

export const getBanks: RequestHandler = async (_req, res) => {
  const banks = await listBanks();
  res.status(200).json({ data: banks });
};

export const preview: RequestHandler = async (req, res) => {
  const input = resolveAccountSchema.parse(req.body);
  const resolved = await previewBankAccount(input.accountNumber, input.bankCode);
  res.status(200).json({ data: resolved });
};

export const create: RequestHandler = async (req, res) => {
  const input = saveBankAccountSchema.parse(req.body);
  const account = await addBankAccount(req.user!.businessId, input);
  res.status(201).json({ data: account });
};

export const list: RequestHandler = async (req, res) => {
  const accounts = await listBankAccounts(req.user!.businessId);
  res.status(200).json({ data: accounts });
};

export const remove: RequestHandler = async (req, res) => {
  const { id } = bankAccountIdParamSchema.parse(req.params);
  await deleteBankAccount(req.user!.businessId, id);
  res.status(204).send();
};