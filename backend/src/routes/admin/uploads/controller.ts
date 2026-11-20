import Controller from "@utils/baseController";
import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";

const imageTypes = {
  "image/jpeg": {
    extension: "jpg",
    matches: (bytes: Buffer) =>
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  "image/png": {
    extension: "png",
    matches: (bytes: Buffer) =>
      bytes
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  "image/webp": {
    extension: "webp",
    matches: (bytes: Buffer) =>
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP",
  },
  "image/avif": {
    extension: "avif",
    matches: (bytes: Buffer) =>
      bytes.toString("ascii", 4, 8) === "ftyp" &&
      ["avif", "avis"].includes(bytes.toString("ascii", 8, 12)),
  },
} as const;

const controller = new (class extends Controller {
  async upload(req: Request, res: Response) {
    const body = req.body as Buffer | undefined;
    const contentType =
      req.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
    const imageType = imageTypes[contentType as keyof typeof imageTypes];
    if (!Buffer.isBuffer(body) || body.length === 0) {
      return this.error(400, "محتوای تصویر ارسال نشده است.");
    }
    if (!imageType || !imageType.matches(body)) {
      return this.error(
        415,
        "فرمت تصویر معتبر نیست. فرمت‌های مجاز JPEG، PNG، WebP و AVIF هستند.",
      );
    }

    const endpoint = process.env.S3_ENDPOINT;
    const bucket = process.env.S3_BUCKET;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;
    if (
      !endpoint ||
      !bucket ||
      !accessKeyId ||
      !secretAccessKey ||
      !publicBaseUrl
    ) {
      return this.error(503, "تنظیمات فضای ابری کامل نیست.");
    }

    const { purpose } = res.locals.validatedQuery as {
      purpose: "products" | "banners";
    };
    const key = `${purpose}/${randomUUID()}.${imageType.extension}`;
    const storage = new Bun.S3Client({
      endpoint,
      bucket,
      region: process.env.S3_REGION || "us-east-1",
      accessKeyId,
      secretAccessKey,
      virtualHostedStyle: false,
    });
    await storage
      .file(key)
      .write(body, { type: contentType, acl: "public-read" });

    const baseUrl = publicBaseUrl.endsWith("/")
      ? publicBaseUrl
      : `${publicBaseUrl}/`;
    const url = new URL(
      key.split("/").map(encodeURIComponent).join("/"),
      baseUrl,
    ).toString();
    return this.response({
      res,
      status: 201,
      message: "تصویر بارگذاری شد.",
      data: { key, url, contentType, size: body.length },
    });
  }
})();

export default controller;
