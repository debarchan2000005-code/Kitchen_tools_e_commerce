import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  User,
  LogOut,
  UserCircle,
  ShoppingCart,
  Heart,
  Search,
  Menu,
  X,
  ChefHat,
  Package,
} from 'lucide-react';
import { useAuthContext } from '../../contexts/CustomerAuthContext';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { supabase } from '../../lib/supabase';

type NavItem = {
  id: string;
  label: string;
  path: string;
  enabled: boolean;
};

export function Navbar() {
  const shouldReduceMotion = useReducedMotion();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [siteNav, setSiteNav] = useState<any>(null);
  const location = useLocation();

  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { isAuthenticated, signOut } = useAuthContext();

  const isLoggedIn = isAuthenticated;

  useEffect(() => {
    let mounted = true;

    async function loadSiteNavigation() {
      const { data, error } = await supabase
        .from('site_navigation')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) {
        console.error('Failed to load site navigation:', error);
        return;
      }

      if (mounted && data) {
        setSiteNav(data);
      }
    }

    loadSiteNavigation();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(
        searchQuery.trim()
      )}`;
    }
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navLinks: NavItem[] = siteNav?.nav_items?.filter(
    (item: NavItem) => item.enabled
  ) ?? [
    { id: 'home', label: 'Home', path: '/', enabled: true },
    { id: 'products', label: 'Products', path: '/products', enabled: true },
    { id: 'about', label: 'About', path: '/about', enabled: true },
    { id: 'contact', label: 'Contact', path: '/contact', enabled: true },
  ];

  const navbarEnabled = siteNav?.navbar_enabled ?? true;
  const showSearch = siteNav?.show_search ?? true;
  const showWishlist = siteNav?.show_wishlist ?? true;
  const showOrders = siteNav?.show_orders ?? true;
  const showCart = siteNav?.show_cart ?? true;
  const showProfile = siteNav?.show_profile ?? true;
  const brandName = siteNav?.brand_name || 'KitchenPro';
  const brandLogoUrl = siteNav?.brand_logo_url || '';
  const showBrandName = siteNav?.show_brand_name ?? true;

  const isActive = (path: string) => location.pathname === path;

  if (!navbarEnabled) return null;

  return (
    <motion.header
      className="bg-white border-b border-gray-100 sticky top-0 z-50"
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.4,
        ease: 'easeOut',
      }}
    >
      <nav className="container-custom">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2 group">
            {brandLogoUrl ? (
              <img
                src={brandLogoUrl}
                alt={brandName}
                className="w-10 h-10 object-contain rounded-lg"
              />
            ) : (
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center group-hover:bg-primary-700 transition-colors">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
            )}

            {showBrandName && (
              <span className="text-xl font-bold text-gray-900">
                {brandName}
              </span>
            )}
          </Link>

          {/* DESKTOP NAVIGATION */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.id}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-primary-600'
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* DESKTOP SEARCH */}
          {showSearch && (
            <form
              onSubmit={handleSearch}
              className="hidden xl:flex items-center flex-1 max-w-md mx-8"
            >
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </form>
          )}

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* WISHLIST - DESKTOP ONLY */}
            {showWishlist && (
              <Link
                to="/wishlist"
                className="hidden lg:flex flex-col items-center text-gray-600 hover:text-primary-600 transition-colors"
              >
                <div className="relative">
                  <Heart className="w-6 h-6" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {wishlistCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-1 font-medium">Wishlist</span>
              </Link>
            )}

            {/* ORDERS - DESKTOP ONLY */}
            {showOrders && (
              <Link
                to="/my-orders"
                className="hidden lg:flex flex-col items-center text-gray-600 hover:text-primary-600 transition-colors"
              >
                <Package className="w-6 h-6" />
                <span className="text-[11px] mt-1 font-medium">Orders</span>
              </Link>
            )}

            {/* CART - DESKTOP + MOBILE */}
            {showCart && (
              <Link
                to="/cart"
                className="flex flex-col items-center text-gray-600 hover:text-primary-600 transition-colors"
              >
                <div className="relative">
                  <ShoppingCart className="w-5 h-5 lg:w-6 lg:h-6" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {itemCount}
                    </span>
                  )}
                </div>
                <span className="hidden lg:block text-[11px] mt-1 font-medium">
                  Cart
                </span>
              </Link>
            )}

            {/* DESKTOP LOGIN / LOGOUT / PROFILE */}
            {showProfile && (
              isLoggedIn ? (
                <>
                  <button
                    onClick={async () => {
                      await signOut();
                      window.location.href = '/';
                    }}
                    className="hidden lg:flex flex-col items-center text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    <LogOut className="w-6 h-6" />
                    <span className="text-[11px] mt-1 font-medium">Logout</span>
                  </button>

                  <Link
                    to="/profile"
                    className="hidden lg:flex flex-col items-center text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    <UserCircle className="w-6 h-6" />
                    <span className="text-[11px] mt-1 font-medium">Profile</span>
                  </Link>
                </>
              ) : (
                <Link
                  to="/login"
                  className="hidden lg:flex flex-col items-center text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <User className="w-6 h-6" />
                  <span className="text-[11px] mt-1 font-medium">Login</span>
                </Link>
              )
            )}

            {/* MOBILE MENU BUTTON */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 lg:hidden flex-shrink-0"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-7 h-7" />
              ) : (
                <Menu className="w-7 h-7" />
              )}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-100 animate-slide-down">
            {/* MOBILE SEARCH */}
            {showSearch && (
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </form>
            )}

            {/* MAIN LINKS */}
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.id}
                  to={link.path}
                  onClick={closeMenu}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* ACCOUNT LINKS */}
            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-gray-100">
              {showWishlist && (
                <Link
                  to="/wishlist"
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  <Heart className="w-5 h-5" />
                  Wishlist
                  {wishlistCount > 0 && (
                    <span className="ml-auto w-5 h-5 bg-accent-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              )}

              {showOrders && (
                <Link
                  to="/my-orders"
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  <Package className="w-5 h-5" />
                  Orders
                </Link>
              )}

              {showProfile && (
                isLoggedIn ? (
                  <>
                    <button
                      onClick={async () => {
                        await signOut();
                        setIsMenuOpen(false);
                        window.location.href = '/';
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 text-left"
                    >
                      <LogOut className="w-5 h-5" />
                      Logout
                    </button>

                    <Link
                      to="/profile"
                      onClick={closeMenu}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                      <UserCircle className="w-5 h-5" />
                      My Profile
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    <User className="w-5 h-5" />
                    Login
                  </Link>
                )
              )}
            </div>
          </div>
        )}
      </nav>
    </motion.header>
  );
}
