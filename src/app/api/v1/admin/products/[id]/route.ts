import { adminProductsController } from "@/server/modules/admin-products/admin-products.controller";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return adminProductsController.update(request, id);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return adminProductsController.delete(request, id);
}
