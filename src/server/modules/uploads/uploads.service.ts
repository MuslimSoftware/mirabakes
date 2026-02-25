import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { AppError } from "@/server/shared/errors/app-error";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif"
]);
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const UPLOADS_DIR = join(process.cwd(), "public", "uploads");
const CONVERT_TO_JPEG_TYPES = new Set(["image/heic", "image/heif", "image/avif"]);

const MIME_BY_EXTENSION: Record<string, string> = {
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  avif: "image/avif"
};

function ensureUploadsDir() {
  if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function extensionForType(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/heic":
      return ".heic";
    case "image/heif":
      return ".heif";
    case "image/avif":
      return ".avif";
    default:
      return "";
  }
}

function resolveMimeType(file: File): string | null {
  const normalizedType = file.type.toLowerCase();
  if (ALLOWED_TYPES.has(normalizedType)) {
    return normalizedType === "image/jpg" ? "image/jpeg" : normalizedType;
  }

  if (normalizedType && normalizedType !== "application/octet-stream") {
    return null;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension) {
    return null;
  }

  return MIME_BY_EXTENSION[extension] ?? null;
}

async function convertImageIfNeeded(
  buffer: Buffer,
  mimeType: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  if (!CONVERT_TO_JPEG_TYPES.has(mimeType)) {
    return { buffer, mimeType };
  }

  let sharpFactory: (input: Buffer) => import("sharp").Sharp;
  try {
    const sharpModule = await import("sharp");
    sharpFactory = (sharpModule.default ?? sharpModule) as unknown as (
      input: Buffer
    ) => import("sharp").Sharp;
  } catch {
    throw new AppError(
      "Image conversion is unavailable on the server",
      500,
      "image_conversion_unavailable"
    );
  }

  try {
    const convertedBuffer = await sharpFactory(buffer).rotate().jpeg({ quality: 88 }).toBuffer();
    return { buffer: convertedBuffer, mimeType: "image/jpeg" };
  } catch {
    throw new AppError("Could not process image file", 400, "invalid_image_file");
  }
}

export const uploadsService = {
  async saveImage(file: File): Promise<string> {
    const mimeType = resolveMimeType(file);
    if (!mimeType) {
      throw new AppError(
        "Only jpeg, png, webp, heic, heif, and avif images are allowed",
        400,
        "invalid_file_type"
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      throw new AppError("Image must be under 10 MB", 400, "file_too_large");
    }

    const sourceBuffer = Buffer.from(await file.arrayBuffer());
    const converted = await convertImageIfNeeded(sourceBuffer, mimeType);
    const hash = createHash("sha256")
      .update(converted.buffer)
      .update(randomBytes(8))
      .digest("hex")
      .slice(0, 16);
    const ext = extensionForType(converted.mimeType);
    const filename = `${hash}${ext}`;

    ensureUploadsDir();
    writeFileSync(join(UPLOADS_DIR, filename), converted.buffer);

    return `/uploads/${filename}`;
  }
};
