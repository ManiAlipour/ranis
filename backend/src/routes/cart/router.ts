import requireAuth from "../../lib/express/auth";
import { Router } from "express";
import cartController from "./controller";
import checkoutController from "./checkout";
import validateCheckout from "./checkoutValidators";
import {
  addItemBodySchema,
  updateItemBodySchema,
  validateBody,
  validateParams,
  variantParamsSchema,
} from "./validators";

const router = Router();
router.use(requireAuth);
router.post("/checkout", validateCheckout, checkoutController.create);
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
