import requireAdmin from "@lib/express/requireAdmin";
import requireAuth from "@lib/express/auth";
import { Router } from "express";
import adminController from "./controller";
import commentAdminController from "../comments/adminController";
import bannerAdminRouter from "../banners/adminRouter";
import contactAdminRouter from "../contacts/adminRouter";
import orderAdminRouter from "./orders/router";
import userAdminRouter from "./users/router";
import transactionAdminRouter from "./transactions/router";
import dashboardController from "./dashboard";
import uploadAdminRouter from "./uploads/router";
import {
  adminCommentQuerySchema,
  commentParamsSchema,
  updateCommentStatusSchema,
  validateAdminComment,
} from "../comments/adminValidators";
import {
  adminCategoryListQuerySchema,
  adminListQuerySchema,
  createCategoryBodySchema,
  createProductBodySchema,
  createVariantBodySchema,
  idParamsSchema,
  productParamsSchema,
  updateCategoryBodySchema,
  updateProductBodySchema,
  updateVariantBodySchema,
  validateBody,
  validateParams,
  validateQuery,
  variantParamsSchema,
} from "./validators";

const router = Router();

router.use(requireAuth, requireAdmin);
router.use("/banners", bannerAdminRouter);
router.use("/contacts", contactAdminRouter);
router.use("/orders", orderAdminRouter);
router.use("/users", userAdminRouter);
router.use("/transactions", transactionAdminRouter);
router.use("/uploads", uploadAdminRouter);
router.get("/dashboard", dashboardController.summary);

router.get(
  "/comments",
  validateAdminComment(adminCommentQuerySchema, "query"),
  commentAdminController.list,
);
router.patch(
  "/comments/:commentId/status",
  validateAdminComment(commentParamsSchema, "params"),
  validateAdminComment(updateCommentStatusSchema, "body"),
  commentAdminController.updateStatus,
);

router.get(
  "/products",
  validateQuery(adminListQuerySchema),
  adminController.listProducts,
);
router.post(
  "/products",
  validateBody(createProductBodySchema),
  adminController.createProduct,
);
router.get(
  "/products/:productId",
  validateParams(productParamsSchema),
  adminController.getProduct,
);
router.patch(
  "/products/:productId",
  validateParams(productParamsSchema),
  validateBody(updateProductBodySchema),
  adminController.updateProduct,
);
router.delete(
  "/products/:productId",
  validateParams(productParamsSchema),
  adminController.archiveProduct,
);

router.get(
  "/products/:productId/variants",
  validateParams(productParamsSchema),
  adminController.listVariants,
);
router.post(
  "/products/:productId/variants",
  validateParams(productParamsSchema),
  validateBody(createVariantBodySchema),
  adminController.createVariant,
);
router.patch(
  "/variants/:variantId",
  validateParams(variantParamsSchema),
  validateBody(updateVariantBodySchema),
  adminController.updateVariant,
);
router.delete(
  "/variants/:variantId",
  validateParams(variantParamsSchema),
  adminController.deactivateVariant,
);

router.get(
  "/categories",
  validateQuery(adminCategoryListQuerySchema),
  adminController.listCategories,
);
router.post(
  "/categories",
  validateBody(createCategoryBodySchema),
  adminController.createCategory,
);
router.get(
  "/categories/:id",
  validateParams(idParamsSchema),
  adminController.getCategory,
);
router.patch(
  "/categories/:id",
  validateParams(idParamsSchema),
  validateBody(updateCategoryBodySchema),
  adminController.updateCategory,
);
router.delete(
  "/categories/:id",
  validateParams(idParamsSchema),
  adminController.deactivateCategory,
);

export default router;
