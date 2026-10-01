import type { RequestHandler } from "express";
import { getDashboardSummary } from "./dashboard.service";

export const summary: RequestHandler = async (req, res) => {
  const data = await getDashboardSummary(req.user!.businessId);
  res.status(200).json({ data });
};