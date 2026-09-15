import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CustomerAuthProvider } from '../../contexts/CustomerAuthContext';
import { CartProvider } from '../../contexts/CartContext';
import { WishlistProvider } from '../../contexts/WishlistContext';

// This layout - and everything nested under it in the router - is the
// entire customer-facing site. CustomerAuthProvider is scoped to exactly
// this subtree, so it is the only thing that manages the customer/guest
// Supabase session. CartProvider/WishlistProvider read from it, not from
// admin state, and none of them are mounted anywhere under /admin.
export function Layout() {
  return (
    <CustomerAuthProvider>
      <CartProvider>
        <WishlistProvider>
          <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <main className="flex-1">
              <Outlet />
            </main>
            <Footer />
          </div>
        </WishlistProvider>
      </CartProvider>
    </CustomerAuthProvider>
  );
}
