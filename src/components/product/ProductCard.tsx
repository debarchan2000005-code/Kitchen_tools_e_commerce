import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Package } from 'lucide-react';
import { formatPrice, calculateDiscount } from '../../lib/utils';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import type { ProductWithDetails } from '../../types';

interface ProductCardProps {
  product: ProductWithDetails;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, isInCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [imageFailed, setImageFailed] = useState(false);

  const primaryGalleryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
  const displayImageUrl = product.image || primaryGalleryImage?.image_url;
  const discount = calculateDiscount(product.original_price || 0, product.price);
  const inWishlist = isInWishlist(product.id);
  const inCart = isInCart(product.id);
  const inStock = product.stock_quantity > 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;
    await addToCart(product);
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product);
    }
  };

  return (
    <Link to={`/product/${product.slug}`} className="group">
      <article className="card-hover relative overflow-hidden duration-500 hover:-translate-y-2 hover:shadow-soft-lg">
        {/* Image */}
        <div className="aspect-square bg-gray-100 relative overflow-hidden">
          {displayImageUrl && !imageFailed ? (
            <img
              src={displayImageUrl}
              alt={primaryGalleryImage?.alt_text || product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-16 h-16 text-gray-300" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {discount > 0 && (
              <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
                {discount}% OFF
              </span>
            )}
            {product.is_bestseller && (
              <span className="bg-primary-600 text-white text-xs font-medium px-2 py-1 rounded">
                Bestseller
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-300 ${
              inWishlist
                ? 'bg-red-500 text-white'
                : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
            }`}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
          </button>

          {/* Quick Add Button */}
          <button
            onClick={handleAddToCart}
            disabled={!inStock}
            className={`absolute bottom-3 right-3 p-2 rounded-full transition-all duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100 ${
              inCart
                ? 'bg-primary-600 text-white'
                : inStock
                ? 'bg-white text-gray-700 hover:bg-primary-600 hover:text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            aria-label={inCart ? 'In cart' : 'Add to cart'}
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category */}
          {product.category && (
            <span className="text-xs text-primary-600 font-medium uppercase tracking-wider">
              {product.category.name}
            </span>
          )}

          {/* Title */}
          <h3 className="mt-1 font-medium text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.round(product.rating)
                      ? 'text-accent-400 fill-current'
                      : 'text-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">({product.review_count})</span>
          </div>

          {/* Price */}
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">{formatPrice(product.price)}</span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.original_price)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className="mt-2">
            {inStock ? (
              <span className="text-xs text-green-600 font-medium">In Stock</span>
            ) : (
              <span className="text-xs text-red-500 font-medium">Out of Stock</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}