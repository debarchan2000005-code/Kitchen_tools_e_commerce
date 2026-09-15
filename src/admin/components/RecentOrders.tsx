import { useEffect, useState } from "react";
import { getRecentOrders } from "../../lib/dashboard";
import { supabaseAdmin as supabase } from "../../lib/supabaseAdmin";
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500",
  "out for delivery": "bg-blue-500",
  delivered: "bg-green-600",
  cancelled: "bg-red-600",
};
export function RecentOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => {
    loadOrders();
    const channel = supabase
      .channel("recent-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => loadOrders()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  async function loadOrders() {
    const data = await getRecentOrders(6);
    setOrders(data || []);
  }
  return (
    <div className="bg-white rounded-xl shadow p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-5">Recent Orders</h2>
      {orders.length === 0 ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="flex justify-between items-center border-b pb-3 gap-3">
              <div className="min-w-0">
                <p className="font-semibold truncate">{order.customer_name}</p>
                <p className="text-sm text-gray-500">{order.order_number}</p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-bold">₹{order.total}</p>
                <div className="flex items-center gap-1.5 justify-end mt-1 flex-wrap">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full text-white ${
                      STATUS_COLORS[order.status] || "bg-gray-500"
                    }`}
                  >
                    {order.status}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full text-white ${
                      order.payment_status === "Paid" ? "bg-green-600" : "bg-orange-500"
                    }`}
                  >
                    {order.payment_status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}