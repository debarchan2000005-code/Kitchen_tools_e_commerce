import { Link } from "react-router-dom";
import { PlusCircle, ShoppingCart, FolderPlus, Image, Settings } from "lucide-react";
const ACTIONS = [
  { label: "Add Product", icon: PlusCircle, to: "/admin/products" },
  { label: "View Orders", icon: ShoppingCart, to: "/admin/orders" },
  { label: "Add Category", icon: FolderPlus, to: "/admin/categories" },
  { label: "Manage Homepage", icon: Image, to: "/admin/homepage" },
  { label: "Settings", icon: Settings, to: "/admin/settings" },
];
export function QuickActions() {
  return (
    <div className="bg-white rounded-xl shadow p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-5">Quick Actions</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.to}
              to={a.to}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border p-4 hover:bg-gray-50 hover:border-blue-300 transition text-center"
            >
              <Icon size={22} className="text-blue-600" />
              <span className="text-sm font-medium">{a.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}