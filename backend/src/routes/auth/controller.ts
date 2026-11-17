import User from "@models/User";
import { generateOTP, hashCode } from "@utils/auth/otp";
import Controller from "@utils/baseController";
import { getExpiryDate } from "@utils/date";
import type { Request, Response } from "express";
import smsService from "../../services/smsService";

const OTP_EXPIRE_MINUTES = 5;

const authController = new (class extends Controller {
  async register(req: Request, res: Response) {
    const { phoneNumber, firstName, lastName } = req.body;

    if (!phoneNumber || typeof phoneNumber !== "string")
      return this.error(400, "شماره تلفن نامعتبر");

    const userExist = await User.findOne({ phoneNumber });

    if (userExist)
      return this.error(401, "کاربر با این شماره تلفن موجود است.");

    const code = generateOTP();
    const hashedCode = await hashCode(code);
    const codeExpire = getExpiryDate(OTP_EXPIRE_MINUTES);

    const user = new User({
      firstName,
      lastName,
      phoneNumber,
      verifyPhone: {
        codeHash: hashedCode,
        codeExpireAt: codeExpire,
      },
    });

    await smsService.sendOtp({
      phoneNumber,
      code,
      expiresInMinutes: OTP_EXPIRE_MINUTES,
    });

    await user.save();

    return this.response({
      res,
      message: "ثبت نام موفق بود. کد تایید ارسال شد.",
      status: 201,
      data: user.toObject(),
    });
  }

  async login(req: Request, res: Response) {}

  async verified(req: Request, res: Response) {}
})();

export default authController;
