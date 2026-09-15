// Database row types based on our schema
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  original_price: number | null;
  category_id: string | null;
  stock_quantity: number;
  sku: string | null;
  rating: number;
  review_count: number;
  is_featured: boolean;
  is_bestseller: boolean;
  specifications: Record<string, string>;
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface ProductWithDetails extends Product {
  images: ProductImage[];
  category: Category | null;
  image?: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product: ProductWithDetails;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product: ProductWithDetails;
}
export type OrderStatus = "pending" | "out for delivery" | "delivered" | "cancelled";
export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  session_id?: string | null; 
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  status: OrderStatus;
  payment_status: "Paid" | "Unpaid" | "Pending" | (string & {});
  payment_method: string;
  estimated_delivery: string | null;
  created_at: string;
}
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
  created_at: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}
export interface Review {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  title: string | null;
  comment: string | null;
  is_verified_purchase: boolean;
  created_at: string;
}
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  created_at: string;
}
export type SortOption = 'newest' | 'price-low' | 'price-high' | 'rating' | 'bestselling';

export interface FilterOptions {
  category: string | null;
  search: string;
  sort: SortOption;
  minPrice: number | null;
  maxPrice: number | null;
  inStock: boolean;
}

export interface CheckoutFormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}