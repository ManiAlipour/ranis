import requireAuth from "../../lib/express/auth";
import { Router } from "express";
import authController from "./controller";
import {
  registerBodySchema,
  requestLoginCodeBodySchema,
  validateBody,
  verifyLoginCodeBodySchema,
  verifyPhoneBodySchema,
} from "./validators";

const router = Router();

router.post(
  "/register",
  validateBody(registerBodySchema),
  authController.register,
);
router.post(
  "/verify",
  validateBody(verifyPhoneBodySchema),
  authController.verify,
);
router.post(
  "/verify/resend",
  validateBody(requestLoginCodeBodySchema),
  authController.resendVerificationCode,
);
router.post(
  "/login",
  validateBody(requestLoginCodeBodySchema),
  authController.login,
);
router.post(
  "/login/verify",
  validateBody(verifyLoginCodeBodySchema),
  authController.verifyLoginCode,
);
router.get("/me", requireAuth, authController.me);
router.post("/refresh", requireAuth, authController.refresh);
router.post("/logout", requireAuth, authController.logout);

export default router;
