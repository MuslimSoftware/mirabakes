const DEFAULT_PENDING_ORDER_EXPIRY_MINUTES = 24 * 60;

export function getPendingOrderExpiryMinutes() {
  const configured = Number(process.env.PENDING_ORDER_EXPIRY_MINUTES ?? DEFAULT_PENDING_ORDER_EXPIRY_MINUTES);
  if (!Number.isFinite(configured) || configured < 1) {
    return DEFAULT_PENDING_ORDER_EXPIRY_MINUTES;
  }

  return Math.round(configured);
}

export function getPendingOrderExpiryCutoff(now = new Date()) {
  return new Date(now.getTime() - getPendingOrderExpiryMinutes() * 60_000);
}
