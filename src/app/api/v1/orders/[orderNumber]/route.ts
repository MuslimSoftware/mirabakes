import { ordersController } from "@/server/modules/orders/orders.controller";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await context.params;
  return ordersController.getPublicStatus(orderNumber);
}
