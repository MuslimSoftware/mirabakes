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

  async findSucceededByOrderId(orderId: string) {
    return prisma.payment.findFirst({
      where: {
        orderId,
        status: PaymentStatus.SUCCEEDED
      }
    });
  }

  async createRefunded(input: { orderId: string; externalId: string; amountCents: number }) {
    return prisma.payment.create({
      data: {
        orderId: input.orderId,
        provider: "stripe",
        externalId: input.externalId,
        amountCents: input.amountCents,
        status: PaymentStatus.REFUNDED
      }
    });
  }
}

export const paymentsRepository = new PaymentsRepository();
