import { Router } from "express";
import controller from "./controller";
import { createContactBodySchema, validateContact } from "./validators";

const router = Router();
router.post(
  "/",
  validateContact(createContactBodySchema, "body"),
  controller.create,
);

export default router;
