import bcrypt from "bcrypt";
import crypto from "crypto";

const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const SALT_ROUNDS = 12;

export function generateOTP() {
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += numbers[crypto.randomInt(numbers.length)];
  }
  return otp;
}

export function hashCode(code: string) {
  return bcrypt.hash(code, SALT_ROUNDS);
}

export function verifyHashCode(hash: string, code: string) {
  return bcrypt.compare(code, hash);
}
