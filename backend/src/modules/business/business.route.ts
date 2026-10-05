import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { getMe, updateMe } from "./business.controller";

export const businessRouter = Router();

businessRouter.use(authenticate);
businessRouter.get("/me", getMe);
businessRouter.patch("/me", updateMe);