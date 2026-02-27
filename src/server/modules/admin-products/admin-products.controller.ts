import { NextResponse } from "next/server";
import { z } from "zod";

import { adminProductsService } from "@/server/modules/admin-products/admin-products.service";
import { assertAdminRequest } from "@/server/shared/auth/admin-auth";
import { AppError } from "@/server/shared/errors/app-error";
import { handleRouteError } from "@/server/shared/errors/http-error-handler";

const updateProductSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
    priceCents: z.number().int().positive().optional(),
    amount: z.string().trim().min(1).nullable().optional(),
    size: z.string().trim().min(1).nullable().optional(),
    calories: z.number().int().positive().nullable().optional(),
    category: z.string().trim().min(1).nullable().optional(),
    imageUrl: z.string().trim().min(1).nullable().optional(),
    isAvailable: z.boolean().optional()
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "At least one field is required"
  });

const createProductSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  priceCents: z.number().int().positive(),
  amount: z.string().trim().min(1).nullable().optional(),
  size: z.string().trim().min(1).nullable().optional(),
  calories: z.number().int().positive().nullable().optional(),
  category: z.string().trim().min(1).nullable().optional(),
  imageUrl: z.string().trim().min(1).nullable().optional(),
  isAvailable: z.boolean().optional()
});

export class AdminProductsController {
  async list(request: Request) {
    try {
      assertAdminRequest(request);

      const url = new URL(request.url);
      const page = Number(url.searchParams.get("page") ?? "1");
      const pageSize = Number(url.searchParams.get("pageSize") ?? "20");
      const category = url.searchParams.get("category") ?? undefined;
      const q = url.searchParams.get("q") ?? undefined;
      const isAvailableQuery = url.searchParams.get("isAvailable");
      const isAvailable =
        isAvailableQuery === "true"
          ? true
          : isAvailableQuery === "false"
            ? false
            : undefined;

      const data = await adminProductsService.list({
        page: Number.isFinite(page) && page > 0 ? page : 1,
        pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 20,
        category,
        q,
        isAvailable
      });

      return NextResponse.json({ data });
    } catch (error) {
      return handleRouteError(error);
    }
  }

  async update(request: Request, id: string) {
    try {
      assertAdminRequest(request);

      const payload = await request.json();
      const parsed = updateProductSchema.safeParse(payload);

      if (!parsed.success) {
        throw new AppError("Invalid product update payload", 400, "invalid_product_payload");
      }

      const data = await adminProductsService.updateById(id, parsed.data);
      return NextResponse.json({ data });
    } catch (error) {
      return handleRouteError(error);
    }
  }

  async create(request: Request) {
    try {
      assertAdminRequest(request);

      const payload = await request.json();
      const parsed = createProductSchema.safeParse(payload);

      if (!parsed.success) {
        throw new AppError("Invalid product create payload", 400, "invalid_product_payload");
      }

      const data = await adminProductsService.create(parsed.data);
      return NextResponse.json({ data }, { status: 201 });
    } catch (error) {
      return handleRouteError(error);
    }
  }

  async delete(request: Request, id: string) {
    try {
      assertAdminRequest(request);
      await adminProductsService.deleteById(id);

      return NextResponse.json({
        data: {
          deleted: true
        }
      });
    } catch (error) {
      return handleRouteError(error);
    }
  }

  async deleteImage(request: Request, productId: string, imageId: string) {
    try {
      assertAdminRequest(request);
      await adminProductsService.deleteImage(productId, imageId);

      return NextResponse.json({
        data: { deleted: true }
      });
    } catch (error) {
      return handleRouteError(error);
    }
  }
}

export const adminProductsController = new AdminProductsController();
