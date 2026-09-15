import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { formatPrice } from '../lib/utils';

export function CartPage() {
  const { items, itemCount, total, removeFromCart, updateQuantity, loading } = useCart();

  if (loading) {
    return (
      <div className="container-custom py-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-32 mb-8"></div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-custom py-16 text-center">
        <ShoppingBag className="w-20 h-20 text-gray-200 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
        <p className="text-gray-600 mb-8">
          Looks like you haven't added anything to your cart yet.
        </p>
        <Link to="/products" className="btn-primary">
          Start Shopping
          <ArrowRight className="ml-2 w-5 h-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <section className="bg-gray-900 text-white py-8 md:py-12">
        <div className="container-custom">
          <h1 className="text-2xl md:text-3xl font-bold">Shopping Cart</h1>
          <p className="text-gray-400 mt-2">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
      </section>


      <section className="py-8 md:py-12 bg-gray-50">
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const primaryImage =
                  item.product.images?.find((img) => img.is_primary) ||
                  item.product.images?.[0];
                const displayImageUrl = item.product.image || primaryImage?.image_url;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl p-4 md:p-6 flex gap-4 md:gap-6"
                  >
                    <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                      {displayImageUrl ? (
                        <Link to={`/product/${item.product.slug}`}>
                          <img
                            src={displayImageUrl}
                            alt={primaryImage?.alt_text || item.product.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        </Link>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No img
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-4">
                        <div>
                          <Link
                            to={`/product/${item.product.slug}`}
                            className="font-medium text-gray-900 hover:text-primary-600 transition-colors"
                          >
                            {item.product.name}
                          </Link>
                          {item.product.category && (
                            <p className="text-sm text-gray-500 mt-1">
                              {item.product.category.name}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product_id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                  
                      <div className="flex items-center border border-gray-200 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="p-2 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-3 font-medium">{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product_id,
                                Math.min(item.quantity + 1, item.product.stock_quantity)
                              )
                            }
                            disabled={item.quantity >= item.product.stock_quantity}
                            className="p-2 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Item Total */}
                        <p className="font-bold text-gray-900">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="bg-white rounded-xl p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h2>

                <div className="space-y-4 pb-6 border-b border-gray-200">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>{total >= 999 ? 'Free' : formatPrice(99)}</span>
                  </div>
                </div>

                <div className="flex justify-between py-6 text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatPrice(total + (total >= 999 ? 0 : 99))}</span>
                </div>

                {total < 999 && (
                  <p className="text-sm text-gray-500 mb-4 bg-gray-50 p-3 rounded-lg">
                    Add items worth {formatPrice(999 - total)} more for free shipping!
                  </p>
                )}

                <Link
                  to="/checkout"
                  className="btn-primary w-full justify-center py-4"
                >
                  Proceed to Checkout
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>

                <Link
                  to="/products"
                  className="block text-center text-sm text-primary-600 hover:text-primary-700 mt-4"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}