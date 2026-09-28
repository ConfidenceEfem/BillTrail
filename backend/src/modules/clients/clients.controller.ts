import type { RequestHandler } from "express";
import {
  clientIdParamSchema,
  createClientSchema,
  listClientsQuerySchema,
  updateClientSchema,
} from "./clients.validation";
import {
  createClient,
  deleteClient,
  getClient,
  listClients,
  updateClient,
} from "./clients.service";

export const create: RequestHandler = async (req, res) => {
  const input = createClientSchema.parse(req.body);
  const client = await createClient(req.user!.businessId, input);
  res.status(201).json({ data: client });
};

export const list: RequestHandler = async (req, res) => {
  const query = listClientsQuerySchema.parse(req.query);
  const result = await listClients(req.user!.businessId, query);
  res.status(200).json({
    data: result.clients,
    meta: { total: result.total, page: result.page, pageSize: result.pageSize },
  });
};

export const getOne: RequestHandler = async (req, res) => {
  const { id } = clientIdParamSchema.parse(req.params);
  const client = await getClient(req.user!.businessId, id);
  res.status(200).json({ data: client });
};

export const update: RequestHandler = async (req, res) => {
  const { id } = clientIdParamSchema.parse(req.params);
  const input = updateClientSchema.parse(req.body);
  const client = await updateClient(req.user!.businessId, id, input);
  res.status(200).json({ data: client });
};

export const remove: RequestHandler = async (req, res) => {
  const { id } = clientIdParamSchema.parse(req.params);
  await deleteClient(req.user!.businessId, id);
  res.status(204).send();
};