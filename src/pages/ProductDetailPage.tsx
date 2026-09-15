import { ReviewForm } from "../components/reviews/ReviewForm";
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Heart,
  ShoppingCart,
  Minus,
  Plus,
  Star,
  ChevronRight,
  Check,
  Truck,
  Shield,
  RotateCcw,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatPrice, calculateDiscount } from '../lib/utils';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { Rating } from '../components/ui/Rating';
import { ProductGrid } from '../components/product/ProductGrid';
import type { ProductWithDetails, Review } from '../types';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');

  const { addToCart, isInCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    async function fetchProduct() {
      if (!slug) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            category:categories (*),
            images:product_images (*)
          `)
          .eq('slug', slug)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Product not found');

        const productData = data as ProductWithDetails;
        setProduct(productData);
        const { data: reviewData } = await supabase
          .from('reviews')
          .select('*')
          .eq('product_id', productData.id)
          .order('created_at', { ascending: false });

        setReviews(reviewData || []);
        if (productData.category_id) {
          const { data: related } = await supabase
            .from('products')
            .select(`
              *,
              category:categories (*),
              images:product_images (*)
            `)
            .eq('category_id', productData.category_id)
            .neq('id', productData.id)
            .limit(4);

          setRelatedProducts(related as ProductWithDetails[] || []);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="container-custom py-8 animate-pulse">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-200 rounded-lg"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded w-2/3"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-custom py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
        <p className="text-gray-600 mb-8">The product you're looking for doesn't exist.</p>
        <Link to="/products" className="btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  const discount = calculateDiscount(product.original_price || 0, product.price);
  const inWishlist = isInWishlist(product.id);
  const inCart = isInCart(product.id);
  const inStock = product.stock_quantity > 0;

  const handleAddToCart = async () => {
    if (!inStock) return;
    await addToCart(product, quantity);
  };

  const handleWishlistToggle = async () => {
    if (inWishlist) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="bg-white border-b border-gray-100">
        <div className="container-custom py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-primary-600">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/products" className="hover:text-primary-600">
              Products
            </Link>
            {product.category && (
              <>
                <ChevronRight className="w-4 h-4" />
                <Link
                  to={`/products?category=${product.category.slug}`}
                  className="hover:text-primary-600"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      <section className="py-8 md:py-12 bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                <img
                  src={
                      product.images?.length
                          ? product.images[selectedImage].image_url
                          : product.image
                            }
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImage(index)}
                      className={`w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === index
                          ? 'border-primary-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image.image_url}
                        alt={image.alt_text || 'Product thumbnail'}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-6">
              {product.category && (
                <Link
                  to={`/products?category=${product.category.slug}`}
                  className="text-sm text-primary-600 font-medium uppercase tracking-wider hover:text-primary-700"
                >
                  {product.category.name}
                </Link>
              )}

              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{product.name}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <Rating value={product.rating} reviewCount={product.review_count} />
                </div>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
                {product.original_price && product.original_price > product.price && (
                  <>
                    <span className="text-xl text-gray-400 line-through">
                      {formatPrice(product.original_price)}
                    </span>
                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-medium">
                      Save {discount}%
                    </span>
                  </>
                )}
              </div>
              {product.short_description && (
                <p className="text-gray-600">{product.short_description}</p>
              )}
              <div className="flex items-center gap-2">
                {inStock ? (
                  <>
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-green-600 font-medium">
                      In Stock ({product.stock_quantity} available)
                    </span>
                  </>
                ) : (
                  <span className="text-red-500 font-medium">Out of Stock</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Quantity:</span>
                <div className="flex items-center border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 font-medium min-w-[3rem] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    disabled={!inStock || quantity >= product.stock_quantity}
                    className="p-2 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className={`flex-1 py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                    inCart
                      ? 'bg-green-500 text-white'
                      : inStock
                      ? 'btn-primary'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {inCart ? 'Added to Cart' : 'Add to Cart'}
                </button>
                <button
                  onClick={handleWishlistToggle}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    inWishlist
                      ? 'border-red-500 bg-red-50 text-red-500'
                      : 'border-gray-200 text-gray-600 hover:border-red-500 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
                </button>
              </div>
              <div className="border-t border-gray-200 pt-6 space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Truck className="w-5 h-5 text-primary-600" />
                  <span>Free shipping on orders above Rs.999</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Shield className="w-5 h-5 text-primary-600" />
                  <span>2-year warranty on all products</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <RotateCcw className="w-5 h-5 text-primary-600" />
                  <span>7-day easy return policy</span>
                </div>
              </div>
              {product.sku && (
                <p className="text-sm text-gray-500">SKU: {product.sku}</p>
              )}
            </div>
          </div>
        </div>
      </section>
      <section className="py-8 md:py-12 bg-gray-50">
        <div className="container-custom">
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('description')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'description'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'reviews'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Reviews ({reviews.length})
            </button>
          </div>

          {activeTab === 'description' ? (
            <div className="bg-white rounded-xl p-6 md:p-8">
              <div className="prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Product Description
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description || product.short_description}
                </p>
              </div>
              {product.specifications &&
                Object.keys(product.specifications).length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Specifications
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between py-3 border-b border-gray-100"
                        >
                          <span className="text-gray-600">{key}</span>
                          <span className="font-medium text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 md:p-8">
              <div className="flex items-center gap-6 mb-8 pb-6 border-b border-gray-100">
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900">{product.rating}</p>
                  <Rating value={product.rating} showValue={false} size="lg" />
                  <p className="text-sm text-gray-500 mt-1">{product.review_count} reviews</p>
                </div>
              </div>
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-gray-900">
                          {review.reviewer_name}
                        </span>
                        {review.is_verified_purchase && (
                          <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <Rating value={review.rating} showValue={false} size="sm" />
                      {review.title && (
                        <p className="font-medium text-gray-900 mt-2">{review.title}</p>
                      )}
                      {review.comment && (
                        <p className="text-gray-600 mt-1">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="w-16 h-16 text-gray-200 mb-4 mx-auto" />
                  <p className="text-gray-500">No reviews yet</p>
                </div>
              )}
            </div>
          )}
          <hr className="my-10" />

<ReviewForm
  productId={product.id}
  onSuccess={async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", product.id)
      .order("created_at", {
        ascending: false,
      });

    setReviews(data || []);
  }}
/>
        </div>
      </section>
      {relatedProducts.length > 0 && (
        <section className="py-8 md:py-12 bg-white">
          <div className="container-custom">
            <h2 className="section-title mb-8">You May Also Like</h2>
            <ProductGrid products={relatedProducts} columns={4} />
          </div>
        </section>
      )}
    </div>
  );
}
