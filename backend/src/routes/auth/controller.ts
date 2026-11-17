import User from "@models/User";
import { generateOTP, hashCode, verifyHashCode } from "@utils/auth/otp";
import {
  createSessionToken,
  getSessionExpiry,
  hashSessionToken,
} from "@utils/auth/session";
import Controller from "@utils/baseController";
import { getExpiryDate } from "@utils/date";
import type { Request, Response } from "express";
import smsService from "../../services/smsService";

const OTP_EXPIRE_MINUTES = 5;
const MAX_OTP_ATTEMPTS = 5;
const OTP_RESEND_SECONDS = 60;

const publicUser = (user: InstanceType<typeof User>) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  phoneNumber: user.phoneNumber,
  role: user.role,
  isVerifiedPhone: user.isVerifiedPhone,
});

const createAuthSession = async (user: InstanceType<typeof User>) => {
  const token = createSessionToken();
  const expiresAt = getSessionExpiry();
  user.authSessions = (user.authSessions ?? []).filter(
    (session) => session.expiresAt.getTime() > Date.now(),
  );
  user.authSessions.push({ tokenHash: hashSessionToken(token), expiresAt });
  await user.save();
  return { token, expiresAt };
};

const authController = new (class extends Controller {
  async register(req: Request, res: Response) {
    const { phoneNumber, firstName, lastName } = req.body;

    if (!phoneNumber || typeof phoneNumber !== "string")
      return this.error(400, "شماره تلفن نامعتبر");

    const userExist = await User.findOne({ phoneNumber });

    if (userExist) return this.error(401, "کاربر با این شماره تلفن موجود است.");

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
        codeSentAt: new Date(),
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
      data: { user: publicUser(user) },
    });
  }

  async verify(req: Request, res: Response) {
    const { phoneNumber, code } = req.body;

    const user = await User.findOne({ phoneNumber });

    if (!user) return this.error(404, "کاربری با این مشخصات یافت نشد.");

    if (user.isVerifiedPhone)
      return this.error(409, "شماره تلفن قبلاً تأیید شده است.");

    const verification = user.verifyPhone;
    if (!verification)
      return this.error(400, "کد تأیید برای این شماره تلفن موجود نیست.");

    if (verification.codeExpireAt.getTime() <= Date.now()) {
      user.set("verifyPhone", undefined);
      await user.save();
      return this.error(400, "کد تأیید منقضی شده است.");
    }

    if (verification.attempts >= MAX_OTP_ATTEMPTS) {
      user.set("verifyPhone", undefined);
      await user.save();
      return this.error(
        429,
        "تعداد تلاش‌های مجاز تمام شده است؛ کد جدید درخواست کنید.",
      );
    }

    const isCodeValid = await verifyHashCode(verification.codeHash, code);
    if (!isCodeValid) {
      verification.attempts += 1;
      if (verification.attempts >= MAX_OTP_ATTEMPTS) {
        user.set("verifyPhone", undefined);
        await user.save();
        return this.error(
          429,
          "تعداد تلاش‌های مجاز تمام شده است؛ کد جدید درخواست کنید.",
        );
      }

      await user.save();
      return this.error(400, "کد تأیید نادرست است.");
    }

    user.isVerifiedPhone = true;
    user.set("verifyPhone", undefined);
    await user.save();
    const session = await createAuthSession(user);

    return this.response({
      res,
      message: "شماره تلفن با موفقیت تأیید شد.",
      data: { ...session, user: publicUser(user) },
    });
  }

  async resendVerificationCode(req: Request, res: Response) {
    const { phoneNumber } = req.body;
    const user = await User.findOne({ phoneNumber });

    if (!user) return this.error(404, "کاربری با این شماره تلفن یافت نشد.");
    if (user.isVerifiedPhone)
      return this.error(409, "شماره تلفن قبلاً تأیید شده است.");

    const sentAt = user.verifyPhone?.codeSentAt;
    if (sentAt) {
      const secondsSinceLastCode = (Date.now() - sentAt.getTime()) / 1000;
      if (secondsSinceLastCode < OTP_RESEND_SECONDS) {
        return this.error(
          429,
          `برای درخواست کد جدید ${Math.ceil(OTP_RESEND_SECONDS - secondsSinceLastCode)} ثانیه صبر کنید.`,
        );
      }
    }

    const code = generateOTP();
    user.verifyPhone = {
      codeHash: await hashCode(code),
      codeExpireAt: getExpiryDate(OTP_EXPIRE_MINUTES),
      codeSentAt: new Date(),
      attempts: 0,
    };

    await smsService.sendOtp({
      phoneNumber,
      code,
      expiresInMinutes: OTP_EXPIRE_MINUTES,
    });
    await user.save();

    return this.response({
      res,
      message: "کد تأیید دوباره ارسال شد.",
      data: { phoneNumber },
    });
  }

  async login(req: Request, res: Response) {
    const { phoneNumber } = req.body;
    const user = await User.findOne({ phoneNumber });

    if (!user) return this.error(404, "کاربری با این شماره تلفن یافت نشد.");
    if (!user.isVerifiedPhone)
      return this.error(403, "ابتدا شماره تلفن خود را تأیید کنید.");
    if (!user.isActive) return this.error(403, "حساب کاربری غیرفعال است.");

    const sentAt = user.loginWithCode?.codeSentAt;
    if (sentAt) {
      const secondsSinceLastCode = (Date.now() - sentAt.getTime()) / 1000;
      if (secondsSinceLastCode < OTP_RESEND_SECONDS) {
        return this.error(
          429,
          `برای درخواست کد جدید ${Math.ceil(OTP_RESEND_SECONDS - secondsSinceLastCode)} ثانیه صبر کنید.`,
        );
      }
    }

    const code = generateOTP();
    user.loginWithCode = {
      codeHash: await hashCode(code),
      codeExpireAt: getExpiryDate(OTP_EXPIRE_MINUTES),
      codeSentAt: new Date(),
      attempts: 0,
    };

    await smsService.sendOtp({
      phoneNumber,
      code,
      expiresInMinutes: OTP_EXPIRE_MINUTES,
    });
    await user.save();

    return this.response({
      res,
      message: "کد ورود برای شما ارسال شد.",
      data: { phoneNumber },
    });
  }

  async verifyLoginCode(req: Request, res: Response) {
    const { phoneNumber, code } = req.body;
    const user = await User.findOne({ phoneNumber });

    if (!user) return this.error(404, "کاربری با این شماره تلفن یافت نشد.");
    if (!user.isVerifiedPhone)
      return this.error(403, "ابتدا شماره تلفن خود را تأیید کنید.");
    if (!user.isActive) return this.error(403, "حساب کاربری غیرفعال است.");

    const loginCode = user.loginWithCode;
    if (!loginCode)
      return this.error(400, "کد ورود موجود نیست؛ دوباره درخواست کد کنید.");

    if (loginCode.codeExpireAt.getTime() <= Date.now()) {
      user.loginWithCode = undefined;
      await user.save();
      return this.error(400, "کد ورود منقضی شده است؛ دوباره درخواست کد کنید.");
    }

    if (loginCode.attempts >= MAX_OTP_ATTEMPTS) {
      user.loginWithCode = undefined;
      await user.save();
      return this.error(
        429,
        "تعداد تلاش‌های مجاز تمام شده است؛ کد جدید درخواست کنید.",
      );
    }

    const isCodeValid = await verifyHashCode(loginCode.codeHash, code);
    if (!isCodeValid) {
      loginCode.attempts += 1;
      if (loginCode.attempts >= MAX_OTP_ATTEMPTS) {
        user.loginWithCode = undefined;
        await user.save();
        return this.error(
          429,
          "تعداد تلاش‌های مجاز تمام شده است؛ کد جدید درخواست کنید.",
        );
      }

      await user.save();
      return this.error(400, "کد ورود نادرست است.");
    }

    user.loginWithCode = undefined;
    await user.save();
    const session = await createAuthSession(user);

    return this.response({
      res,
      message: "ورود با موفقیت انجام شد.",
      data: { ...session, user: publicUser(user) },
    });
  }

  async me(_req: Request, res: Response) {
    const user = res.locals.authUser as InstanceType<typeof User>;
    return this.response({ res, data: publicUser(user) });
  }

  async refresh(_req: Request, res: Response) {
    const user = res.locals.authUser as InstanceType<typeof User>;
    const currentHash = res.locals.authTokenHash as string;
    user.authSessions = user.authSessions.filter(
      (session) => session.tokenHash !== currentHash,
    );
    const session = await createAuthSession(user);
    return this.response({
      res,
      message: "نشست با موفقیت تمدید شد.",
      data: { ...session, user: publicUser(user) },
    });
  }

  async logout(_req: Request, res: Response) {
    const user = res.locals.authUser as InstanceType<typeof User>;
    const currentHash = res.locals.authTokenHash as string;
    user.authSessions = user.authSessions.filter(
      (session) => session.tokenHash !== currentHash,
    );
    await user.save();
    return this.response({ res, message: "با موفقیت خارج شدید." });
  }
})();

export default authController;
