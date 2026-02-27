import { NextResponse } from "next/server";

import { prisma } from "@/server/shared/db/prisma";
import { handleRouteError } from "@/server/shared/errors/http-error-handler";
import { AppError } from "@/server/shared/errors/app-error";

export class ImagesController {
  async getById(id: string) {
    try {
      const image = await prisma.productImage.findUnique({
        where: { id },
        select: { data: true, mimeType: true }
      });

      if (!image) {
        throw new AppError("Image not found", 404, "image_not_found");
      }

      return new NextResponse(image.data, {
        headers: {
          "Content-Type": image.mimeType,
          "Cache-Control": "public, max-age=31536000, immutable"
        }
      });
    } catch (error) {
      return handleRouteError(error);
    }
  }
}

export const imagesController = new ImagesController();
