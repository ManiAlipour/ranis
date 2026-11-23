import requireAuth from "../../lib/express/auth";
import { Router } from "express";
import userController from "./controller";
import {
  addressBodySchema,
  addressParamsSchema,
  orderParamsSchema,
  paginationQuerySchema,
  updateAddressBodySchema,
  updateProfileBodySchema,
  validateBody,
  validateParams,
  validateQuery,
} from "./validators";

const router = Router();

router.use(requireAuth);

router.get("/me", userController.getProfile);
router.patch(
  "/me",
  validateBody(updateProfileBodySchema),
  userController.updateProfile,
);

router.get("/me/addresses", userController.listAddresses);
router.post(
  "/me/addresses",
  validateBody(addressBodySchema),
  userController.createAddress,
);
router.patch(
  "/me/addresses/:addressId",
  validateParams(addressParamsSchema),
  validateBody(updateAddressBodySchema),
  userController.updateAddress,
);
router.delete(
  "/me/addresses/:addressId",
  validateParams(addressParamsSchema),
  userController.deleteAddress,
);

router.get(
  "/me/orders",
  validateQuery(paginationQuerySchema),
  userController.listOrders,
);
router.get(
  "/me/orders/:orderId",
  validateParams(orderParamsSchema),
  userController.getOrder,
);
router.get(
  "/me/transactions",
  validateQuery(paginationQuerySchema),
  userController.listTransactions,
);
router.get(
  "/me/comments",
  validateQuery(paginationQuerySchema),
  userController.listComments,
);

export default router;
