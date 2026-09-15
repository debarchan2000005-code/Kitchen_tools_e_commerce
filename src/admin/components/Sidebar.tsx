import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  UserCheck,
  Star,
  Settings,
  Image,
  Info,
  Mail,
  ReceiptText,
  PanelTop,
} from "lucide-react";
const menus = [
  { name: "Homepage", icon: Image, path: "/admin/homepage" },
  { name: "Dashboard", icon: LayoutDashboard, path: "/admin", end: true },
  { name: "Products", icon: Package, path: "/admin/products" },
  { name: "Categories", icon: FolderTree, path: "/admin/categories" },
  { name: "Orders", icon: ShoppingCart, path: "/admin/orders" },
  { name: "Customers", icon: Users, path: "/admin/customers" },
  { name: "Users", icon: UserCheck, path: "/admin/users" },
  { name: "Reviews", icon: Star, path: "/admin/reviews" },
  { name: "Invoice Management", icon: ReceiptText, path: "/admin/invoice-management" },
  { name: "Navbar & Footer", icon: PanelTop, path: "/admin/navbar-footer" },
  { name: "Settings", icon: Settings, path: "/admin/settings" },
  { name: "About Page", icon: Info, path: "/admin/about-page" },
  { name: "Contact Page", icon: Mail, path: "/admin/contact-page" },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onNavigate: () => void;
}
export function Sidebar({ collapsed, mobileOpen, onNavigate }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onNavigate}
        />
      )}
      <aside
        className={`
          bg-slate-900 text-white h-screen flex-shrink-0
          transition-all duration-300 ease-out
          fixed lg:static top-0 left-0 z-50 lg:z-auto
          ${collapsed ? "lg:w-20" : "lg:w-64"}
          w-64
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="p-6 text-2xl font-bold border-b border-slate-700 overflow-hidden whitespace-nowrap">
          {collapsed ? "KT" : "Kitchen Tools"}
        </div>
        <nav className="mt-5">
          {menus.map((menu) => {
            const Icon = menu.icon;
            return (
              <NavLink
                key={menu.path}
                to={menu.path}
                end={menu.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-4 transition ${
                    isActive ? "bg-primary-600 text-white" : "hover:bg-slate-800"
                  }`
                }
              >
                <Icon size={20} className="flex-shrink-0" />
                {!collapsed && <span className="whitespace-nowrap">{menu.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}