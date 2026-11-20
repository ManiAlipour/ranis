import { Router } from "express";
import controller from "./controller";
import {
  contactListQuerySchema,
  contactParamsSchema,
  updateContactStatusBodySchema,
  validateContact,
} from "./validators";

const router = Router();
router.get(
  "/",
  validateContact(contactListQuerySchema, "query"),
  controller.list,
);
router.get(
  "/:contactId",
  validateContact(contactParamsSchema, "params"),
  controller.get,
);
router.patch(
  "/:contactId/status",
  validateContact(contactParamsSchema, "params"),
  validateContact(updateContactStatusBodySchema, "body"),
  controller.updateStatus,
);

export default router;
