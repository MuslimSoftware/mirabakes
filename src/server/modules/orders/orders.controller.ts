import { NextResponse } from "next/server";

import { ordersService } from "@/server/modules/orders/orders.service";
import { handleRouteError } from "@/server/shared/errors/http-error-handler";

export class OrdersController {
  async getPublicStatus(orderNumber: string) {
    try {
      const data = await ordersService.getPublicStatus(orderNumber);
      return NextResponse.json({ data });
    } catch (error) {
      return handleRouteError(error);
    }
  }
}

export const ordersController = new OrdersController();
