import {Router} from "express"
import { loginHandler, logoutHandler, me, refreshHandler, register, verifyEmailHandler } from "./auth.controller"
import { authenticate } from "../../middleware/authenticate";

const authRouter = Router()

authRouter.post("/register", register)
authRouter.get("/verify-email", verifyEmailHandler);
authRouter.post("/login", loginHandler);
authRouter.post("/refresh", refreshHandler);
authRouter.post("/logout", logoutHandler);
authRouter.get("/me", authenticate, me);

export default authRouter

