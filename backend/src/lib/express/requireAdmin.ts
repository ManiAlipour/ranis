import type { RequestHandler } from "express";

const requireAdmin: RequestHandler = (_req, res, next) => {
  const user = res.locals.authUser as { role?: string } | undefined;
  if (!user || (user.role !== "admin" && user.role !== "owner")) {
    res.status(403).json({
      success: false,
      message: "اجازه دسترسی به این بخش را ندارید.",
    });
    return;
  }
  next();
};

export default requireAdmin;
