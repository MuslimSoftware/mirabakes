import { imagesController } from "@/server/modules/images/images.controller";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return imagesController.getById(id);
}
