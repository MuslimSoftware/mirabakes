import { AppError } from "@/server/shared/errors/app-error";
import { ordersRepository } from "@/server/modules/orders/orders.repository";

export class OrdersService {
  async getPublicStatus(orderNumber: string) {
    const order = await ordersRepository.findPublicByOrderNumber(orderNumber);

    if (!order) {
      throw new AppError("Order not found", 404, "order_not_found");
    }

    return order;
  }
}

export const ordersService = new OrdersService();
