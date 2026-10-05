import type { RequestHandler } from "express";
import { updateBusinessSchema } from "./business.validation";
import { getBusiness, updateBusiness } from "./business.service";

export const getMe: RequestHandler = async (req, res) => {
  const business = await getBusiness(req.user!.businessId);
  res.status(200).json({ data: business });
};

export const updateMe: RequestHandler = async (req, res) => {
  const input = updateBusinessSchema.parse(req.body);
  const business = await updateBusiness(req.user!.businessId, input);
  res.status(200).json({ data: business });
};