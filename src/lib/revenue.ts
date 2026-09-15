// Single source of truth for what counts as "revenue" across the dashboard.
//
// Rule: an order contributes to revenue ONLY when payment has actually been
// received (payment_status === "Paid") AND the order has not been cancelled.
//
// Because every revenue figure is recomputed from current order state
// (rather than incremented/decremented manually), a cancelled paid order
// automatically stops counting - no special "undo" logic is needed anywhere.
//
// Confirmed against the existing code:
//  - OrdersPage.tsx reads order.payment_status === "Paid" for its green badge
//  - orders.ts's updateOrderStatus() writes payment_status = "Paid" / "Unpaid"
//  - OrdersPage.tsx's status <select> only offers: pending, out for delivery,
//    delivered, cancelled - that dropdown is the only place status is ever
//    set, so it is treated here as the authoritative status enum.

export const PAID_STATUS = "Paid";
export const CANCELLED_STATUS = "cancelled";

export interface RevenueOrderLike {
  total: number | string;
  payment_status?: string | null;
  status?: string | null;
}

export function isRevenueOrder(order: RevenueOrderLike): boolean {
  return order.payment_status === PAID_STATUS && order.status !== CANCELLED_STATUS;
}

export function getOrderRevenue(order: RevenueOrderLike): number {
  return isRevenueOrder(order) ? Number(order.total) || 0 : 0;
}

export function sumRevenue(orders: RevenueOrderLike[]): number {
  return orders.reduce((sum, o) => sum + getOrderRevenue(o), 0);
}