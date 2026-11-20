import { Router } from "express";
import controller from "./controller";
import {
  adminTransactionListQuerySchema,
  adminTransactionParamsSchema,
  validateAdminTransaction,
} from "./validators";

const router = Router();
router.get(
  "/",
  validateAdminTransaction(adminTransactionListQuerySchema, "query"),
  controller.list,
);
router.get(
  "/:transactionId",
  validateAdminTransaction(adminTransactionParamsSchema, "params"),
  controller.get,
);

export default router;
