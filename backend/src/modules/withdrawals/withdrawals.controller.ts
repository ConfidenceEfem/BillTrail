import type { RequestHandler } from "express";
import { createWithdrawalSchema } from "./withdrawals.validation";
import { requestWithdrawal, listWithdrawals } from "./withdrawals.service";
import { getAvailableBalance } from "./balance.service";

export const getBalance: RequestHandler = async (req, res) => {
  const balance = await getAvailableBalance(req.user!.businessId);
  res.status(200).json({ data: { availableBalance: balance } });
};

export const create: RequestHandler = async (req, res) => {
  const input = createWithdrawalSchema.parse(req.body);
  const withdrawal = await requestWithdrawal(req.user!.businessId, input);
  res.status(201).json({ data: withdrawal });
};

export const list: RequestHandler = async (req, res) => {
  const withdrawals = await listWithdrawals(req.user!.businessId);
  res.status(200).json({ data: withdrawals });
};