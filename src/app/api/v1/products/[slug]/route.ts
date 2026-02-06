import { productsController } from "@/server/modules/products/products.controller";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  return productsController.getBySlug(slug);
}
