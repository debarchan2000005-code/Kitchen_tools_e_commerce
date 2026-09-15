import { ArrowUp, ArrowDown, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import type { DashboardWidget } from "../../lib/dashboardWidgets";
const WIDGET_LABELS: Record<string, string> = {
  kpi_revenue: "Revenue KPI",
  kpi_orders: "Orders KPI",
  kpi_pending_payments: "Pending Payments KPI",
  kpi_cancelled_orders: "Cancelled Orders KPI",
  kpi_products: "Products KPI",
  kpi_customers: "Customers KPI",
  revenue_chart: "Revenue Chart",
  recent_orders: "Recent Orders",
  pending_payments: "Pending Payments List",
  low_stock: "Low Stock Products",
  order_status_overview: "Order Status Overview",
  sales_overview: "Sales Overview",
  quick_actions: "Quick Actions",
};
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${on ? "bg-green-500" : "bg-gray-300"}`}
    >
      <span
        className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
interface Props {
  widgets: DashboardWidget[];
  onToggle: (key: string, enabled: boolean) => void;
  onMove: (key: string, dir: "up" | "down") => void;
}
export function DashboardWidgetControls({ widgets, onToggle, onMove }: Props) {
  const [open, setOpen] = useState(false);
  const ordered = [...widgets].sort((a, b) => a.display_order - b.display_order);
  return (
    <div className="bg-white rounded-xl border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 sm:px-6 py-4 font-semibold"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal size={18} /> Customize Dashboard
        </span>
        <span className="text-sm text-gray-400">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div className="border-t divide-y">
          {ordered.map((w, idx) => (
            <div key={w.widget_key} className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
              <span className="text-sm font-medium truncate">
                {WIDGET_LABELS[w.widget_key] || w.widget_key}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => onMove(w.widget_key, "up")}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  disabled={idx === ordered.length - 1}
                  onClick={() => onMove(w.widget_key, "down")}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
                >
                  <ArrowDown size={16} />
                </button>
                <Toggle on={w.is_enabled} onChange={(v) => onToggle(w.widget_key, v)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}