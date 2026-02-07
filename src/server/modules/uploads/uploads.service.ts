import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { AppError } from "@/server/shared/errors/app-error";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const UPLOADS_DIR = join(process.cwd(), "public", "uploads");

function ensureUploadsDir() {
  if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function extensionForType(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      return "";
  }
}

export const uploadsService = {
  async saveImage(file: File): Promise<string> {
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new AppError("Only jpeg, png, and webp images are allowed", 400, "invalid_file_type");
    }

    if (file.size > MAX_SIZE_BYTES) {
      throw new AppError("Image must be under 5 MB", 400, "file_too_large");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const hash = createHash("sha256")
      .update(buffer)
      .update(randomBytes(8))
      .digest("hex")
      .slice(0, 16);
    const ext = extensionForType(file.type);
    const filename = `${hash}${ext}`;

    ensureUploadsDir();
    writeFileSync(join(UPLOADS_DIR, filename), buffer);

    return `/uploads/${filename}`;
  }
};
