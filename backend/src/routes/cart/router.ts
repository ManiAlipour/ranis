import requireAuth from "@lib/express/auth";
import { Router } from "express";
import cartController from "./controller";
import {
  addItemBodySchema,
  updateItemBodySchema,
  validateBody,
  validateParams,
  variantParamsSchema,
} from "./validators";

const router = Router();
router.use(requireAuth);
router.get("/", cartController.get);
router.post("/items", validateBody(addItemBodySchema), cartController.addItem);
router.patch(
  "/items/:variantId",
  validateParams(variantParamsSchema),
  validateBody(updateItemBodySchema),
  cartController.updateItem,
);
router.delete(
  "/items/:variantId",
  validateParams(variantParamsSchema),
  cartController.removeItem,
);
router.delete("/", cartController.clear);

export default router;
