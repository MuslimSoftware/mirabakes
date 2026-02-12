import { OrderStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { adminOrdersService } from "@/server/modules/admin-orders/admin-orders.service";
import { assertAdminRequest } from "@/server/shared/auth/admin-auth";
import { handleRouteError } from "@/server/shared/errors/http-error-handler";

const validStatuses = new Set(Object.values(OrderStatus));

export class AdminOrdersController {
  async list(request: Request) {
    try {
      assertAdminRequest(request);

      const url = new URL(request.url);
      const page = Number(url.searchParams.get("page") ?? "1");
      const pageSize = Number(url.searchParams.get("pageSize") ?? "20");
      const statusParam = url.searchParams.get("status")?.toUpperCase();
      const status =
        statusParam && validStatuses.has(statusParam as OrderStatus)
          ? (statusParam as OrderStatus)
          : undefined;

      const data = await adminOrdersService.list({
        page: Number.isFinite(page) && page > 0 ? page : 1,
        pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 20,
        status
      });

      return NextResponse.json({ data });
    } catch (error) {
      return handleRouteError(error);
    }
  }
}

export const adminOrdersController = new AdminOrdersController();
