import User from "@models/User";
import Controller from "@utils/baseController";
import type { Request, Response } from "express";

const authController = new (class extends Controller {
  async register(req: Request, res: Response) {
    const { phoneNumber, firstName, lastName } = req.body;

    if (!phoneNumber || typeof phoneNumber !== "string")
      return this.error(400, "شماره تلفن نامعتبر");

    const userExist = await User.findOne({ phoneNumber });
  }

  async login(req: Request, res: Response) {}

  async verified(req: Request, res: Response) {}
})();

export default authController;
