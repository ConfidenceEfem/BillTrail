import { prisma } from "../../lib/prisma";
import { ConflictError, ForbiddenError, NotFoundError } from "../../lib/errors";
import type { CreateClientInput, UpdateClientInput, ListClientsQuery } from "./clients.validation";

export async function createClient(businessId: string, input: CreateClientInput) {
  const existing = await prisma.client.findUnique({
    where: { businessId_email: { businessId, email: input.email } },
  });
  if (existing && !existing.deletedAt) {
    throw new ConflictError("A client with this email already exists for your business");
  }

  return prisma.client.create({
    data: { ...input, businessId },
  });
}

export async function listClients(businessId: string, query: ListClientsQuery) {
  const where = { businessId, deletedAt: null };

  // page doesn't require the count and the rows to be a perfect snapshot.
  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.client.count({ where }),
  ]);

  return { clients, total, page: query.page, pageSize: query.pageSize };
}

async function getOwnedClientOrThrow(businessId: string, clientId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, businessId, deletedAt: null },
  });
  if (!client) {

    throw new NotFoundError("Client not found");
  }
  return client;
}

export async function getClient(businessId: string, clientId: string) {
  return getOwnedClientOrThrow(businessId, clientId);
}

export async function updateClient(businessId: string, clientId: string, input: UpdateClientInput) {
  await getOwnedClientOrThrow(businessId, clientId); // throws 404 if not theirs

  if (input.email) {
    const existing = await prisma.client.findUnique({
      where: { businessId_email: { businessId, email: input.email } },
    });
    if (existing && existing.id !== clientId && !existing.deletedAt) {
      throw new ConflictError("Another client already uses this email");
    }
  }

  return prisma.client.update({ where: { id: clientId }, data: input });
}

export async function deleteClient(businessId: string, clientId: string) {
  await getOwnedClientOrThrow(businessId, clientId);

  const invoiceCount = await prisma.invoice.count({ where: { clientId } });
  if (invoiceCount > 0) {

    return prisma.client.update({ where: { id: clientId }, data: { deletedAt: new Date() } });
  }


  return prisma.client.delete({ where: { id: clientId } });
}