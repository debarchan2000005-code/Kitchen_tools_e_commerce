import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import { useAuthContext } from "../contexts/CustomerAuthContext";

function statusBadgeClass(status: string) {
  switch (status?.toLowerCase()) {
    case "delivered":
      return "bg-green-100 text-green-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    case "out for delivery":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
}

export function MyOrdersPage() {
  const { user } = useAuthContext();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    let active = true;

    async function loadOrders() {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading orders:", error);
        return;
      }

      if (active) {
        setOrders(data || []);
        setLoading(false);
      }
    }

    loadOrders();

    // Realtime updates
    const channel = supabase
      .channel(`my-orders-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    // Fallback refresh
    const interval = setInterval(loadOrders, 5000);

    return () => {
      active = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          My Orders
        </h1>

        {loading ? (
          <p className="text-gray-500">Loading your orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-500">
            You haven't placed any orders yet.
          </p>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/track-order/${order.order_number}`}
                className="block bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition"
              >
                <div className="p-6 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-lg">
                      {order.order_number}
                    </p>

                    <p className="text-gray-500 mt-2">
                      ₹{order.total}
                    </p>

                    <p className="text-sm text-gray-400 mt-2">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <span
                    className={`px-4 py-2 rounded-full font-semibold ${statusBadgeClass(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}