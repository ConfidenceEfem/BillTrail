import {Router} from "express"
import { loginHandler, logoutHandler, me, refreshHandler, register, requestPasswordResetHandler, resetPasswordHandler, verifyEmailHandler } from "./auth.controller"
import { authenticate } from "../../middleware/authenticate";

const authRouter = Router()

authRouter.post("/register", register)
authRouter.get("/verify-email", verifyEmailHandler);
authRouter.post("/login", loginHandler);
authRouter.post("/refresh", refreshHandler);
authRouter.post("/logout", logoutHandler);
authRouter.get("/me", authenticate, me);
authRouter.post("/forgot-password", requestPasswordResetHandler);
authRouter.post("/reset-password", resetPasswordHandler);

export default authRouter

