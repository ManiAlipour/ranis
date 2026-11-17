import { Router } from "express";
import catalogController from "./controller";
import {
  productListQuerySchema,
  slugParamsSchema,
  validateParams,
  validateQuery,
} from "./validators";

const router = Router();

router.get("/categories", catalogController.listCategories);
router.get(
  "/categories/:slug",
  validateParams(slugParamsSchema),
  catalogController.getCategory,
);

router.get(
  "/products",
  validateQuery(productListQuerySchema),
  catalogController.listProducts,
);
router.get(
  "/products/:slug",
  validateParams(slugParamsSchema),
  catalogController.getProduct,
);

export default router;
