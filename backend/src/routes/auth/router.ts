import { Router } from "express";
import authController from "./controller";
import { registerBodySchema, validateBody } from "./validators";

const router = Router();

router.post("/register", validateBody(registerBodySchema), authController.register);

export default router;
