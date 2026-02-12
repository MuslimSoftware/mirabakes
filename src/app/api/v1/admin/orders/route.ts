import { adminOrdersController } from "@/server/modules/admin-orders/admin-orders.controller";

export async function GET(request: Request) {
  return adminOrdersController.list(request);
}
