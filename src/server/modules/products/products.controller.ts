import { NextResponse } from "next/server";

import { productsService } from "@/server/modules/products/products.service";
import { handleRouteError } from "@/server/shared/errors/http-error-handler";

export class ProductsController {
  async list(request: Request) {
    try {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get("page") ?? "1");
      const pageSize = Number(url.searchParams.get("pageSize") ?? "12");
      const category = url.searchParams.get("category") ?? undefined;
      const q = url.searchParams.get("q") ?? undefined;

      const data = await productsService.listAvailable({
        page: Number.isFinite(page) && page > 0 ? page : 1,
        pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 12,
        category,
        q
      });

      return NextResponse.json({ data });
    } catch (error) {
      return handleRouteError(error);
    }
  }

  async getBySlug(slug: string) {
    try {
      const data = await productsService.getPublicBySlug(slug);
      return NextResponse.json({ data });
    } catch (error) {
      return handleRouteError(error);
    }
  }
}

export const productsController = new ProductsController();
