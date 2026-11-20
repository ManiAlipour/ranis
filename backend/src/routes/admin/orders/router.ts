import { Router } from "express";
import controller from "./controller";
import {
  orderListQuerySchema,
  orderParamsSchema,
  updateOrderStatusBodySchema,
  validateOrder,
} from "./validators";

const router = Router();
router.get("/", validateOrder(orderListQuerySchema, "query"), controller.list);
router.get(
  "/:orderId",
  validateOrder(orderParamsSchema, "params"),
  controller.get,
);
router.patch(
  "/:orderId/status",
  validateOrder(orderParamsSchema, "params"),
  validateOrder(updateOrderStatusBodySchema, "body"),
  controller.updateStatus,
);

export default router;
