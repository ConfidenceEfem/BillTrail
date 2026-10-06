import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { create, getOne, list, remove, update } from "./recurring-invoices.controller";

export const recurringInvoicesRouter = Router();

recurringInvoicesRouter.use(authenticate);
recurringInvoicesRouter.post("/", create);
recurringInvoicesRouter.get("/", list);
recurringInvoicesRouter.get("/:id", getOne);
recurringInvoicesRouter.patch("/:id", update);
recurringInvoicesRouter.delete("/:id", remove);