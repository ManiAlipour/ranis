import { Router, raw } from "express";
import controller from "./controller";
import { validateUploadPurpose } from "./validators";

const router = Router();
router.post(
  "/",
  validateUploadPurpose,
  raw({ type: "image/*", limit: "8mb" }),
  controller.upload,
);

export default router;
