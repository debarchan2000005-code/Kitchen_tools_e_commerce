import { supabaseAdmin as supabase } from "./supabaseAdmin";
import { isRevenueOrder } from "./revenue";

export type RevenueRange = "7d" | "30d" | "3m" | "6m" | "1y";

const RANGE_DAYS: Record<RevenueRange, number> = {
  "7d": 7,
  "30d": 30,
  "3m": 90,
  "6m": 182,
  "1y": 365,
};

export interface RevenuePoint {
  label: string;
  revenue: number;
}

export async function getRevenueChart(range: RevenueRange = "30d"): Promise<RevenuePoint[]> {
  const days = RANGE_DAYS[range];
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("orders")
    .select("total, created_at, status, payment_status")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  if (error) throw error;

  const buckets = new Map<string, number>();
  const useMonthly = range === "6m" || range === "1y";

  (data || []).forEach((order: any) => {
    if (!isRevenueOrder(order)) return;

    const d = new Date(order.created_at);
    const key = useMonthly
      ? d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
      : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

    buckets.set(key, (buckets.get(key) || 0) + (Number(order.total) || 0));
  });

  return Array.from(buckets.entries()).map(([label, revenue]) => ({ label, revenue }));
}