import { useEffect, useState } from "react";
import { supabaseAdmin as supabase } from "../../lib/supabaseAdmin";
import {
  IndianRupee,
  ShoppingCart,
  Package,
  Users,
  Clock,
  XCircle,
} from "lucide-react";

import { getDashboardStats } from "../../lib/dashboard";
import {
  getDashboardWidgets,
  setDashboardWidgetEnabled,
  reorderDashboardWidgets,
  type DashboardWidget,
} from "../../lib/dashboardWidgets";
import { requestNotificationPermission, showOrderNotification } from "../../lib/browserNotifications";

import { RevenueChart } from "../components/RevenueChart";
import { RecentOrders } from "../components/RecentOrders";
import { LowStockProducts } from "../components/LowStockProducts";
import { SalesOverview } from "../components/SalesOverview";
import { PendingPayments } from "../components/PendingPayments";
import { OrderStatusOverview } from "../components/OrderStatusOverview";
import { QuickActions } from "../components/QuickActions";
import { DashboardWidgetControls } from "../components/DashboardWidgetControls";

const KPI_CONFIG = [
  {
    key: "kpi_revenue",
    label: "Paid Revenue",
    icon: IndianRupee,
    color: "green",
    value: (s: any) => `₹${Number(s.revenue).toLocaleString("en-IN")}`,
  },
  { key: "kpi_orders", label: "Orders", icon: ShoppingCart, color: "blue", value: (s: any) => s.orders },
  {
    key: "kpi_pending_payments",
    label: "Pending Payments",
    icon: Clock,
    color: "orange",
    value: (s: any) => s.pendingPayments,
  },
  {
    key: "kpi_cancelled_orders",
    label: "Cancelled Orders",
    icon: XCircle,
    color: "red",
    value: (s: any) => s.cancelledOrders,
  },
  { key: "kpi_products", label: "Products", icon: Package, color: "purple", value: (s: any) => s.products },
  { key: "kpi_customers", label: "Customers", icon: Users, color: "indigo", value: (s: any) => s.customers },
];

const COLOR_CLASSES: Record<string, string> = {
  green: "bg-green-100 text-green-600",
  blue: "bg-blue-100 text-blue-600",
  orange: "bg-orange-100 text-orange-600",
  red: "bg-red-100 text-red-600",
  purple: "bg-purple-100 text-purple-600",
  indigo: "bg-indigo-100 text-indigo-600",
};

const SECTION_SPAN: Record<string, string> = {
  revenue_chart: "xl:col-span-2",
  quick_actions: "xl:col-span-2",
  order_status_overview: "xl:col-span-2",
};

export function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);

  useEffect(() => {
    requestNotificationPermission();
    loadStats();
    loadWidgets();

    const channel = supabase
      .channel("dashboard-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          loadStats();

          if (payload.eventType === "INSERT") {
            const order = payload.new as any;
            showOrderNotification(
              "🛒 New Order Received",
              `${order.customer_name} placed Order #${order.order_number}`
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadStats() {
    const data = await getDashboardStats();
    setStats(data);
  }

  async function loadWidgets() {
    try {
      const data = await getDashboardWidgets();
      setWidgets(data);
    } catch (e) {
      console.error("Dashboard widget settings unavailable (has the migration run?):", e);
    }
  }

  async function handleToggle(key: string, enabled: boolean) {
    setWidgets((prev) => prev.map((w) => (w.widget_key === key ? { ...w, is_enabled: enabled } : w)));
    try {
      await setDashboardWidgetEnabled(key, enabled);
    } catch (e) {
      console.error("Failed to save widget toggle:", e);
    }
  }

  async function handleMove(key: string, dir: "up" | "down") {
    const ordered = [...widgets].sort((a, b) => a.display_order - b.display_order);
    const idx = ordered.findIndex((w) => w.widget_key === key);
    const swapWith = dir === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= ordered.length) return;

    [ordered[idx], ordered[swapWith]] = [ordered[swapWith], ordered[idx]];
    const reindexed = ordered.map((w, i) => ({ ...w, display_order: i }));
    setWidgets(reindexed);
    try {
      await reorderDashboardWidgets(reindexed.map((w) => w.widget_key));
    } catch (e) {
      console.error("Failed to save widget order:", e);
    }
  }

  function isOn(key: string) {
    if (widgets.length === 0) return true; 
    return widgets.find((w) => w.widget_key === key)?.is_enabled ?? true;
  }

  function orderOf(key: string) {
    return widgets.find((w) => w.widget_key === key)?.display_order ?? 999;
  }

  if (!stats) {
    return <p>Loading...</p>;
  }

  const sections = [
    
    { key: "recent_orders", node: <RecentOrders /> },
    { key: "pending_payments", node: <PendingPayments /> },
    { key: "low_stock", node: <LowStockProducts /> },
    { key: "order_status_overview", node: <OrderStatusOverview /> },
    { key: "sales_overview", node: <SalesOverview /> },
    { key: "revenue_chart", node: <RevenueChart /> },
    { key: "quick_actions", node: <QuickActions /> },
    
  ]
    .filter((s) => isOn(s.key))
    .sort((a, b) => orderOf(a.key) - orderOf(b.key));

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, Admin </p>
      </div>

      {widgets.length > 0 && (
        <DashboardWidgetControls widgets={widgets} onToggle={handleToggle} onMove={handleMove} />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
        {KPI_CONFIG.filter((k) => isOn(k.key)).map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.key}
              className="bg-white rounded-xl shadow p-4 sm:p-6 flex justify-between items-center gap-3"
            >
              <div className="min-w-0">
                <p className="text-gray-500 text-sm truncate">{k.label}</p>
                <h2 className="text-xl sm:text-2xl font-bold truncate">{k.value(stats)}</h2>
              </div>
              <div className={`p-2.5 sm:p-3 rounded-xl flex-shrink-0 ${COLOR_CLASSES[k.color]}`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {sections.map((s) => (
          <div key={s.key} className={SECTION_SPAN[s.key] || ""}>
            {s.node}
          </div>
        ))}
      </div>
    </div>
  );
}