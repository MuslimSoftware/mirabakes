import { productsController } from "@/server/modules/products/products.controller";

export async function GET(request: Request) {
  return productsController.list(request);
}
