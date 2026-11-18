import { Router } from "express";
import controller from "./adminController";
import {
  adminBannerQuerySchema,
  bannerParamsSchema,
  createBannerBodySchema,
  updateBannerBodySchema,
  validateBanner,
} from "./validators";

const router = Router();
router.get(
  "/",
  validateBanner(adminBannerQuerySchema, "query"),
  controller.list,
);
router.post(
  "/",
  validateBanner(createBannerBodySchema, "body"),
  controller.create,
);
router.get(
  "/:bannerId",
  validateBanner(bannerParamsSchema, "params"),
  controller.get,
);
router.patch(
  "/:bannerId",
  validateBanner(bannerParamsSchema, "params"),
  validateBanner(updateBannerBodySchema, "body"),
  controller.update,
);
router.delete(
  "/:bannerId",
  validateBanner(bannerParamsSchema, "params"),
  controller.deactivate,
);

export default router;
