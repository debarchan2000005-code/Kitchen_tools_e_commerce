import { useEffect, useState } from "react";
import { getSalesOverview } from "../../lib/dashboard";
import { supabaseAdmin as supabase } from "../../lib/supabaseAdmin";

export function SalesOverview() {
  const [sales, setSales] = useState<any>(null);

  useEffect(() => {
    loadSales();

    const channel = supabase
      .channel("sales-overview")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => loadSales()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadSales() {
    const data = await getSalesOverview();
    setSales(data);
  }

  if (!sales) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-5">
        📊 Sales Overview
      </h2>

      <div className="space-y-4">
        <div className="flex justify-between">
          <span>Today's Paid Revenue</span>
          <b>₹{sales.todayRevenue}</b>
        </div>

        <div className="flex justify-between">
          <span>This Week</span>
          <b>₹{sales.weekRevenue}</b>
        </div>

        <div className="flex justify-between">
          <span>This Month</span>
          <b>₹{sales.monthRevenue}</b>
        </div>

        <hr />

        <div className="flex justify-between">
          <span>Orders Today</span>
          <b>{sales.todayOrders}</b>
        </div>
      </div>
    </div>
  );
}