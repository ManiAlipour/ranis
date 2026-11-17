import User from "@models/User";
import { getBearerToken, hashSessionToken } from "@utils/auth/session";
import type { RequestHandler } from "express";

const requireAuth: RequestHandler = async (req, res, next) => {
  const token = getBearerToken(req.get("authorization"));
  if (!token) {
    res
      .status(401)
      .json({ success: false, message: "ابتدا وارد حساب خود شوید." });
    return;
  }

  const tokenHash = hashSessionToken(token);
  const user = await User.findOne({
    isActive: true,
    isVerifiedPhone: true,
    authSessions: {
      $elemMatch: { tokenHash, expiresAt: { $gt: new Date() } },
    },
  });

  if (!user) {
    res
      .status(401)
      .json({ success: false, message: "نشست معتبر نیست؛ دوباره وارد شوید." });
    return;
  }

  res.locals.authUser = user;
  res.locals.authTokenHash = tokenHash;
  next();
};

export default requireAuth;
