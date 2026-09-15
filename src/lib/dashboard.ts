import { supabaseAdmin as supabase } from "./supabaseAdmin";
import { isRevenueOrder, sumRevenue, CANCELLED_STATUS, PAID_STATUS } from "./revenue";

export const LOW_STOCK_THRESHOLD = 5;

export async function getDashboardStats() {
  const [products, categories, customers, reviews, ordersRes] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase.from("reviews").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("total, status, payment_status"),
  ]);

  const orders = ordersRes.data || [];

  const revenue = sumRevenue(orders);
  const totalOrders = orders.length;
  const cancelledOrders = orders.filter((o: any) => o.status === CANCELLED_STATUS).length;
  const pendingPayments = orders.filter(
    (o: any) => o.payment_status !== PAID_STATUS && o.status !== CANCELLED_STATUS
  ).length;

  return {
    revenue,
    orders: totalOrders,
    pendingPayments,
    cancelledOrders,
    products: products.count || 0,
    categories: categories.count || 0,
    customers: customers.count || 0,
    reviews: reviews.count || 0,
  };
}

export async function getRecentOrders(limit = 6) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getPendingPaymentOrders(limit = 6) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .neq("payment_status", PAID_STATUS)
    .neq("status", CANCELLED_STATUS)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getOrderStatusCounts() {
  const { data, error } = await supabase.from("orders").select("status");
  if (error) throw error;

  const counts: Record<string, number> = {
    pending: 0,
    "out for delivery": 0,
    delivered: 0,
    cancelled: 0,
  };

  (data || []).forEach((o: any) => {
    counts[o.status] = (counts[o.status] || 0) + 1;
  });

  return counts;
}

export async function getSalesOverview() {
  const { data, error } = await supabase
    .from("orders")
    .select("total, created_at, status, payment_status");

  if (error) throw error;

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  let todayRevenue = 0;
  let weekRevenue = 0;
  let monthRevenue = 0;
  let todayOrders = 0;

  (data || []).forEach((order: any) => {
    const orderDate = new Date(order.created_at);
    const orderDay = orderDate.toISOString().split("T")[0];
    const revenueAmount = isRevenueOrder(order) ? Number(order.total) || 0 : 0;

    if (orderDay === todayStr) {
      todayRevenue += revenueAmount;
      todayOrders++;
    }

    const diffDays = (today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays <= 7) weekRevenue += revenueAmount;

    if (
      orderDate.getMonth() === today.getMonth() &&
      orderDate.getFullYear() === today.getFullYear()
    ) {
      monthRevenue += revenueAmount;
    }
  });

  return { todayRevenue, weekRevenue, monthRevenue, todayOrders };
}

export async function getLowStockProducts(limit = 5) {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, stock_quantity, image")
    .lte("stock_quantity", LOW_STOCK_THRESHOLD)
    .order("stock_quantity", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data;
}