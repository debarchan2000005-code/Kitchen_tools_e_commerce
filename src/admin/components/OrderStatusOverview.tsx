import { useEffect, useState } from "react";
import { getOrderStatusCounts } from "../../lib/dashboard";
import { supabaseAdmin as supabase } from "../../lib/supabaseAdmin";

const STATUS_META: { key: string; label: string; color: string }[] = [
  { key: "pending", label: "Order Received", color: "bg-yellow-500" },
  { key: "out for delivery", label: "Out for Delivery", color: "bg-blue-500" },
  { key: "delivered", label: "Delivered", color: "bg-green-600" },
  { key: "cancelled", label: "Cancelled", color: "bg-red-600" },
];

export function OrderStatusOverview() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    load();

    const channel = supabase
      .channel("order-status-overview")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function load() {
    const data = await getOrderStatusCounts();
    setCounts(data);
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-5">Order Status Overview</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUS_META.map((s) => (
          <div key={s.key} className="rounded-lg border p-3 text-center">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${s.color} mb-2`} />
            <p className="text-2xl font-bold">{counts[s.key] || 0}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}