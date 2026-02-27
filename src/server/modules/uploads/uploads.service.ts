import { AppError } from "@/server/shared/errors/app-error";
import { prisma } from "@/server/shared/db/prisma";

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

async function processImage(
  buffer: Buffer,
  mimeType: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  let sharpFactory: (input: Buffer) => import("sharp").Sharp;
  try {
    const sharpModule = await import("sharp");
    sharpFactory = (sharpModule.default ?? sharpModule) as unknown as (
      input: Buffer
    ) => import("sharp").Sharp;
  } catch {
    if (CONVERT_TO_JPEG_TYPES.has(mimeType)) {
      throw new AppError("Image conversion is unavailable on the server", 500, "image_conversion_unavailable");
    }
    return { buffer, mimeType };
  }

  try {
    if (CONVERT_TO_JPEG_TYPES.has(mimeType)) {
      const converted = await sharpFactory(buffer).rotate().resize(1200, undefined, { withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer();
      return { buffer: converted, mimeType: "image/jpeg" };
    }

    const resized = await sharpFactory(buffer).rotate().resize(1200, undefined, { withoutEnlargement: true }).toBuffer();
    return { buffer: resized, mimeType };
  } catch {
    throw new AppError("Could not process image file", 400, "invalid_image_file");
  }
}

export const uploadsService = {
  async saveImage(file: File, productId: string): Promise<{ id: string; url: string }> {
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

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppError("Product not found", 404, "product_not_found");
    }

    const sourceBuffer = Buffer.from(await file.arrayBuffer());
    const processed = await processImage(sourceBuffer, mimeType);

    const maxPosition = await prisma.productImage.aggregate({
      where: { productId },
      _max: { position: true }
    });

    const image = await prisma.productImage.create({
      data: {
        productId,
        data: new Uint8Array(processed.buffer),
        mimeType: processed.mimeType,
        position: (maxPosition._max.position ?? -1) + 1
      }
    });

    return { id: image.id, url: `/api/v1/images/${image.id}` };
  }
};
