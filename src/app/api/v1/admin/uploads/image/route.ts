import { uploadsController } from "@/server/modules/uploads/uploads.controller";

export async function POST(request: Request) {
  return uploadsController.uploadImage(request);
}
