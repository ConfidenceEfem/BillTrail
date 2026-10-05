import { prisma } from "../../lib/prisma";
import type { UpdateBusinessInput } from "./business.validation";

export async function getBusiness(businessId: string) {
  return prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { id: true, name: true, phone: true, address: true, currency: true },
  });
}

export async function updateBusiness(businessId: string, input: UpdateBusinessInput) {
  return prisma.business.update({
    where: { id: businessId },
    data: input,
    select: { id: true, name: true, phone: true, address: true, currency: true },
  });
}