import { adminOrdersController } from "@/server/modules/admin-orders/admin-orders.controller";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return adminOrdersController.getById(request, id);
}
