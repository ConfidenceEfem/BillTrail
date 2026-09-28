import { Router } from "express";
import { getOne, list, update, create, remove } from "./clients.controller";
import { authenticate } from "../../middleware/authenticate";


const clientRouter = Router()

clientRouter.use(authenticate)

clientRouter.post("/", create)
clientRouter.get("/", list),
clientRouter.get("/:id", getOne)
clientRouter.patch("/:id", update)
clientRouter.delete("/:id", remove)

export default clientRouter