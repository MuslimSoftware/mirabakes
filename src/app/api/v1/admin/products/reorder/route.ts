import { adminProductsController } from "@/server/modules/admin-products/admin-products.controller";

export async function PATCH(request: Request) {
  return adminProductsController.reorder(request);
}
