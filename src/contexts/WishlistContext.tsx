import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { WishlistItem, ProductWithDetails } from '../types';
import { useAuthContext } from './CustomerAuthContext';

interface WishlistContextType {
  items: WishlistItem[];
  itemCount: number;
  loading: boolean;
  addToWishlist: (product: ProductWithDetails) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuthContext();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(authLoading);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select(
          `*, product:products (*, category:categories (*), images:product_images (*))`
        )
        .eq('user_id', user.id);
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = async (product: ProductWithDetails) => {
    if (!user) return;
    const existingItem = items.find((item) => item.product_id === product.id);
    if (!existingItem) {
      const { error } = await supabase.from('wishlist_items').insert({
        user_id: user.id,
        product_id: product.id,
      });
      if (error) throw error;
      await fetchWishlist();
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);
    if (error) throw error;
    await fetchWishlist();
  };

  const clearWishlist = async () => {
    if (!user) return;
    const { error } = await supabase.from('wishlist_items').delete().eq('user_id', user.id);
    if (error) throw error;
    setItems([]);
  };

  const isInWishlist = (productId: string) => items.some((item) => item.product_id === productId);
  const itemCount = items.length;

  return (
    <WishlistContext.Provider
      value={{ items, itemCount, loading, addToWishlist, removeFromWishlist, clearWishlist, isInWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}