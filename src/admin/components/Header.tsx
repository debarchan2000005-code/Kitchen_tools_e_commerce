import { Search, Menu } from "lucide-react";
interface HeaderProps {
  onToggleSidebar: () => void;
}
export function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-3 sm:px-4 lg:px-8 gap-2">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition duration-200 flex-shrink-0"
        >
          <Menu size={22} />
        </button>
        <div className="relative min-w-0 w-32 sm:w-64 lg:w-80">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-2 sm:pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </header>
  );
}