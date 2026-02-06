import { checkoutController } from "@/server/modules/checkout/checkout.controller";

export async function POST(request: Request) {
  return checkoutController.createSession(request);
}
