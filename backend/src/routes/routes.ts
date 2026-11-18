import { Router } from "express";
import authRouter from "./auth/router";
import adminRouter from "./admin/router";
import catalogRouter from "./catalog/router";
import userRouter from "./user/router";
import cartRouter from "./cart/router";
import commentRouter from "./comments/router";
import bannerRouter from "./banners/router";

const router = Router();

router.use("/auth", authRouter);
router.use("/admin", adminRouter);
router.use("/users", userRouter);
router.use("/cart", cartRouter);
router.use("/products/:productSlug/comments", commentRouter);
router.use("/banners", bannerRouter);
router.use(catalogRouter);

export default router;
