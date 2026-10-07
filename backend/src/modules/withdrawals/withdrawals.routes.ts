import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { getBalance, create, list } from "./withdrawals.controller";

export const withdrawalsRouter = Router();

withdrawalsRouter.use(authenticate);
withdrawalsRouter.get("/balance", getBalance);
withdrawalsRouter.post("/", create);
withdrawalsRouter.get("/", list);