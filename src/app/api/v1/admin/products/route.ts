import { adminProductsController } from "@/server/modules/admin-products/admin-products.controller";

export async function GET(request: Request) {
  return adminProductsController.list(request);
}

export async function POST(request: Request) {
  return adminProductsController.create(request);
}
