import { Outlet, useLocation } from 'react-router-dom';
import { useLayoutEffect } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CustomerAuthProvider } from '../../contexts/CustomerAuthContext';
import { CartProvider } from '../../contexts/CartContext';
import { WishlistProvider } from '../../contexts/WishlistContext';

export function Layout() {
  const { pathname, search } = useLocation();
  useLayoutEffect(() => {
    window.history.scrollRestoration = 'manual';

    const scrollingElement = document.scrollingElement;
    if (scrollingElement) {
      scrollingElement.scrollTop = 0;
      scrollingElement.scrollLeft = 0;
    }

    window.scrollTo(0, 0);
  }, [pathname, search]);

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
