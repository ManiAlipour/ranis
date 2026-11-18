import requireAuth from "@lib/express/auth";
import { Router } from "express";
import controller from "./controller";
import {
  commentListQuerySchema,
  createCommentBodySchema,
  productSlugParamsSchema,
  validate,
} from "./validators";

const router = Router({ mergeParams: true });
router.get(
  "/",
  validate(productSlugParamsSchema, "params"),
  validate(commentListQuerySchema, "query"),
  controller.list,
);
router.post(
  "/",
  requireAuth,
  validate(productSlugParamsSchema, "params"),
  validate(createCommentBodySchema, "body"),
  controller.create,
);

export default router;
