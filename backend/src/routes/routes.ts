import { Router } from "express";
import authRouter from "./auth/router";
import catalogRouter from "./catalog/router";
import userRouter from "./user/router";

const router = Router();

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use(catalogRouter);

export default router;
