import { Router } from "express";
import controller from "./controller";
import { publicBannerQuerySchema, validateBanner } from "./validators";

const router = Router();
router.get(
  "/",
  validateBanner(publicBannerQuerySchema, "query"),
  controller.list,
);

export default router;
