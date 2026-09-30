import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { cancel, create, getOne, list, remove, send, update } from "./invoices.controller";

export const invoicesRouter = Router();

invoicesRouter.use(authenticate);

invoicesRouter.post("/", create);
invoicesRouter.get("/", list);
invoicesRouter.get("/:id", getOne);
invoicesRouter.patch("/:id", update);
invoicesRouter.delete("/:id", remove);
invoicesRouter.post("/:id/send", send);
invoicesRouter.post("/:id/cancel", cancel);