import { NextResponse } from "next/server";

import { uploadsService } from "@/server/modules/uploads/uploads.service";
import { assertAdminRequest } from "@/server/shared/auth/admin-auth";
import { AppError } from "@/server/shared/errors/app-error";
import { handleRouteError } from "@/server/shared/errors/http-error-handler";

export class UploadsController {
  async uploadImage(request: Request) {
    try {
      assertAdminRequest(request);

      const formData = await request.formData();
      const file = formData.get("file");
      const productId = formData.get("productId");

      if (!file || !(file instanceof File)) {
        throw new AppError("Missing file in form data", 400, "missing_file");
      }

      if (!productId || typeof productId !== "string") {
        throw new AppError("Missing productId in form data", 400, "missing_product_id");
      }

      const result = await uploadsService.saveImage(file, productId);
      return NextResponse.json({ data: result }, { status: 201 });
    } catch (error) {
      return handleRouteError(error);
    }
  }
}

export const uploadsController = new UploadsController();
