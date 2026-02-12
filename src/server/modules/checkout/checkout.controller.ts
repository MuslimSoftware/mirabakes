import { NextResponse } from "next/server";
import { z } from "zod";

import { checkoutService } from "@/server/modules/checkout/checkout.service";
import { AppError } from "@/server/shared/errors/app-error";
import { handleRouteError } from "@/server/shared/errors/http-error-handler";

const createCheckoutSessionSchema = z.object({
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().trim().min(1),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive()
      })
    )
    .min(1)
});

export class CheckoutController {
  async createSession(request: Request) {
    try {
      const payload = await request.json();
      const parsed = createCheckoutSessionSchema.safeParse(payload);

      if (!parsed.success) {
        throw new AppError("Invalid checkout payload", 400, "invalid_checkout_payload");
      }

      const origin = new URL(request.url).origin;
      const data = await checkoutService.createStripeSession({
        ...parsed.data,
        origin
      });

      return NextResponse.json({ data });
    } catch (error) {
      return handleRouteError(error);
    }
  }
}

export const checkoutController = new CheckoutController();
