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

      if (!file || !(file instanceof File)) {
        throw new AppError("Missing file in form data", 400, "missing_file");
      }

      const url = await uploadsService.saveImage(file);
      return NextResponse.json({ data: { url } }, { status: 201 });
    } catch (error) {
      return handleRouteError(error);
    }
  }
}

export const uploadsController = new UploadsController();
