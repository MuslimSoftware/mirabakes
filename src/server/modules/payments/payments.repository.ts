import { PaymentStatus } from "@prisma/client";

import { prisma } from "@/server/shared/db/prisma";

export class PaymentsRepository {
  async createSucceeded(input: { orderId: string; externalId: string; amountCents: number }) {
    return prisma.payment.upsert({
      where: {
        provider_externalId: {
          provider: "stripe",
          externalId: input.externalId
        }
      },
      create: {
        orderId: input.orderId,
        provider: "stripe",
        externalId: input.externalId,
        amountCents: input.amountCents,
        status: PaymentStatus.SUCCEEDED
      },
      update: {
        status: PaymentStatus.SUCCEEDED,
        amountCents: input.amountCents
      }
    });
  }

  async createFailed(input: { orderId: string; externalId: string; amountCents: number }) {
    return prisma.payment.upsert({
      where: {
        provider_externalId: {
          provider: "stripe",
          externalId: input.externalId
        }
      },
      create: {
        orderId: input.orderId,
        provider: "stripe",
        externalId: input.externalId,
        amountCents: input.amountCents,
        status: PaymentStatus.FAILED
      },
      update: {
        status: PaymentStatus.FAILED,
        amountCents: input.amountCents
      }
    });
  }
}

export const paymentsRepository = new PaymentsRepository();
