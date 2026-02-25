import { createStripeCheckoutSession } from "@/server/integrations/stripe/stripe.client";
import { checkoutRepository } from "@/server/modules/checkout/checkout.repository";
import { AppError } from "@/server/shared/errors/app-error";

function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MB-${timestamp}-${random}`;
}

function fillOrderNumberTemplate(template: string, orderNumber: string) {
  return template
    .replaceAll("{ORDER_NUMBER}", orderNumber)
    .replaceAll("{orderNumber}", orderNumber);
}

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function resolveSuccessUrl(orderNumber: string, origin: string) {
  const fallback = `${origin}/order/${orderNumber}`;
  const template = process.env.STRIPE_SUCCESS_URL_TEMPLATE;
  if (!template) {
    return fallback;
  }

  const resolved = fillOrderNumberTemplate(template, orderNumber);
  return isHttpUrl(resolved) ? resolved : fallback;
}

function resolveCancelUrl(origin: string) {
  const configured = process.env.STRIPE_CANCEL_URL;
  if (!configured) {
    return `${origin}`;
  }

  return isHttpUrl(configured) ? configured : `${origin}`;
}

export class CheckoutService {
  async createStripeSession(input: {
    items: Array<{ productId: string; quantity: number }>;
    customerEmail?: string;
    customerPhone: string;
    origin: string;
  }) {
    if (input.items.length < 1) {
      throw new AppError("Cart is empty", 400, "empty_cart");
    }

    const uniqueProductIds = [...new Set(input.items.map((item) => item.productId))];
    const products = await checkoutRepository.findAvailableProductsByIds(uniqueProductIds);

    if (products.length !== uniqueProductIds.length) {
      throw new AppError("One or more products are unavailable", 400, "invalid_cart_items");
    }

    const productById = new Map(products.map((product) => [product.id, product]));

    const normalizedItems = input.items.map((item) => {
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new AppError("Invalid quantity", 400, "invalid_quantity");
      }

      const product = productById.get(item.productId);
      if (!product) {
        throw new AppError("One or more products are unavailable", 400, "invalid_cart_items");
      }

      return {
        productId: product.id,
        quantity: item.quantity,
        unitPriceCents: product.priceCents,
        name: product.name,
        description: product.description
      };
    });

    const subtotalCents = normalizedItems.reduce(
      (sum, item) => sum + item.unitPriceCents * item.quantity,
      0
    );

    const orderNumber = generateOrderNumber();
    await checkoutRepository.createPendingOrder({
      orderNumber,
      subtotalCents,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      items: normalizedItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents
      }))
    });

    const session = await createStripeCheckoutSession({
      lineItems: normalizedItems.map((item) => ({
        name: item.name,
        description: item.description,
        unitAmount: item.unitPriceCents,
        quantity: item.quantity
      })),
      customerEmail: input.customerEmail,
      successUrl: resolveSuccessUrl(orderNumber, input.origin),
      cancelUrl: resolveCancelUrl(input.origin),
      metadata: {
        orderNumber
      }
    });

    await checkoutRepository.attachStripeSessionId(orderNumber, session.id);

    if (!session.url) {
      throw new AppError("Unable to create checkout URL", 500, "stripe_checkout_failed");
    }

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
      orderNumber
    };
  }
}

export const checkoutService = new CheckoutService();
