import { adminProductsController } from "@/server/modules/admin-products/admin-products.controller";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; imageId: string }> }
) {
  const { id, imageId } = await context.params;
  return adminProductsController.deleteImage(request, id, imageId);
}
