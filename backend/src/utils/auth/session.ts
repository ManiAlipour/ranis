import { createHash, randomBytes } from "crypto";

export const AUTH_SESSION_DAYS = 30;

export const createSessionToken = () => randomBytes(32).toString("base64url");

export const hashSessionToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const getSessionExpiry = () =>
  new Date(Date.now() + AUTH_SESSION_DAYS * 24 * 60 * 60 * 1000);

export const getBearerToken = (authorization?: string) => {
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1];
};
