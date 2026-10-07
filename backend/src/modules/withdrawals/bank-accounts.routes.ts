import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { getBanks, preview, create, list, remove } from "./bank-accounts.controller";

export const bankAccountsRouter = Router();

bankAccountsRouter.use(authenticate);
bankAccountsRouter.get("/banks", getBanks);
bankAccountsRouter.post("/preview", preview);
bankAccountsRouter.post("/", create);
bankAccountsRouter.get("/", list);
bankAccountsRouter.delete("/:id", remove);