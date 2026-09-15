import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, ArrowRight } from 'lucide-react';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { formatPrice } from '../lib/utils';

export function WishlistPage() {
  const { items, itemCount, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();

  if (loading) {
    return (
      <div className="container-custom py-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-32 mb-8"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-custom py-16 text-center">
        <Heart className="w-20 h-20 text-gray-200 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Wishlist is Empty</h1>
        <p className="text-gray-600 mb-8">
          Save your favorite items for later by adding them to your wishlist.
        </p>
        <Link to="/products" className="btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <section className="bg-gray-900 text-white py-8 md:py-12">
        <div className="container-custom">
          <h1 className="text-2xl md:text-3xl font-bold">My Wishlist</h1>
          <p className="text-gray-400 mt-2">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} saved
          </p>
        </div>
      </section>
      <section className="py-8 md:py-12 bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {items.map((item) => {
              const primaryImage =
                item.product.images?.find((img) => img.is_primary) ||
                item.product.images?.[0];
              const displayImageUrl = item.product.image || primaryImage?.image_url;
              const inStock = item.product.stock_quantity > 0;

              return (
                <div key={item.id} className="bg-white rounded-xl overflow-hidden group">
                  <div className="aspect-square bg-gray-100 relative">
                    {displayImageUrl ? (
                      <Link to={`/product/${item.product.slug}`}>
                        <img
                          src={displayImageUrl}
                          alt={primaryImage?.alt_text || item.product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </Link>
                    ) : (
                      <div className="w-full h-full"></div>
                    )}
                    <button
                      onClick={() => removeFromWishlist(item.product_id)}
                      className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                  <div className="p-4">
                    <Link
                      to={`/product/${item.product.slug}`}
                      className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 text-sm"
                    >
                      {item.product.name}
                    </Link>

                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="font-bold text-gray-900">
                        {formatPrice(item.product.price)}
                      </span>
                      {item.product.original_price &&
                        item.product.original_price > item.product.price && (
                          <span className="text-sm text-gray-400 line-through">
                            {formatPrice(item.product.original_price)}
                          </span>
                        )}
                    </div>
                    <div className="mt-3 space-y-2">
                      <p className={`text-xs font-medium ${inStock ? 'text-green-600' : 'text-red-500'}`}>
                        {inStock ? 'In Stock' : 'Out of Stock'}
                      </p>
                      <button
                        onClick={() => {
                          addToCart(item.product);
                          removeFromWishlist(item.product_id);
                        }}
                        disabled={!inStock}
                        className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                          inStock
                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <Link to="/products" className="btn-primary inline-flex">
              Continue Shopping
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}