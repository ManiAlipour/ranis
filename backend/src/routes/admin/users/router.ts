import { Router } from "express";
import controller from "./controller";
import {
  adminUserListQuerySchema,
  adminUserParamsSchema,
  updateUserActiveBodySchema,
  updateUserRoleBodySchema,
  validateAdminUser,
} from "./validators";

const router = Router();
router.get(
  "/",
  validateAdminUser(adminUserListQuerySchema, "query"),
  controller.list,
);
router.get(
  "/:userId",
  validateAdminUser(adminUserParamsSchema, "params"),
  controller.get,
);
router.patch(
  "/:userId/status",
  validateAdminUser(adminUserParamsSchema, "params"),
  validateAdminUser(updateUserActiveBodySchema, "body"),
  controller.updateActive,
);
router.patch(
  "/:userId/role",
  validateAdminUser(adminUserParamsSchema, "params"),
  validateAdminUser(updateUserRoleBodySchema, "body"),
  controller.updateRole,
);

export default router;
