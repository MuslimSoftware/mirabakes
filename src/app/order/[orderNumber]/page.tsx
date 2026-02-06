import { OrderStatusView } from "@/frontend/features/checkout/order-status-view";

export default async function OrderPage({
  params
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  return (
    <main>
      <OrderStatusView orderNumber={orderNumber} />
    </main>
  );
}
