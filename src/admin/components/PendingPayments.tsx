import { useEffect, useState } from "react";
import { getPendingPaymentOrders } from "../../lib/dashboard";
import { supabaseAdmin as supabase } from "../../lib/supabaseAdmin";

export function PendingPayments() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    load();

    const channel = supabase
      .channel("pending-payments")
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
    const data = await getPendingPaymentOrders(6);
    setOrders(data || []);
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-5">💳 Pending Payments</h2>

      {orders.length === 0 ? (
        <p className="text-gray-500">No pending payments right now.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="flex justify-between items-center border-b pb-3 gap-3">
              <div className="min-w-0">
                <p className="font-semibold truncate">{order.customer_name}</p>
                <p className="text-sm text-gray-500 truncate">
                  {order.order_number} · {order.payment_method}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold">₹{order.total}</p>
                <span className="text-xs px-2.5 py-1 rounded-full text-white bg-orange-500">
                  {order.payment_status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}