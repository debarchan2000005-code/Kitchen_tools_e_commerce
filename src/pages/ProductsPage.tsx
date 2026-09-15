import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProductGrid } from '../components/product/ProductGrid';
import type { ProductWithDetails, Category, SortOption } from '../types';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'bestselling', label: 'Bestselling' },
];

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const selectedCategory = searchParams.get('category') || '';
  const searchQuery = searchParams.get('search') || '';
  const sortBy = (searchParams.get('sort') as SortOption) || 'newest';
  const featured = searchParams.get('featured') === 'true';
  const bestseller = searchParams.get('bestseller') === 'true';
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        let query = supabase
          .from('products')
          .select(`
            *,
            category:categories (*),
            images:product_images (*)
          `);
        if (selectedCategory) {
          const { data: catData } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', selectedCategory)
            .single();

          if (catData) {
            query = query.eq('category_id', catData.id);
          }
        }
        if (featured) {
          query = query.eq('is_featured', true);
        }
        if (bestseller) {
          query = query.eq('is_bestseller', true);
        }
        if (searchQuery) {
          query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }
        switch (sortBy) {
          case 'price-low':
            query = query.order('price', { ascending: true });
            break;
          case 'price-high':
            query = query.order('price', { ascending: false });
            break;
          case 'rating':
            query = query.order('rating', { ascending: false });
            break;
          case 'bestselling':
            query = query.order('is_bestseller', { ascending: false });
            break;
          default:
            query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;

        if (error) throw error;
        setProducts((data || []) as ProductWithDetails[]);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [selectedCategory, searchQuery, sortBy, featured, bestseller]);

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from('categories').select('*').order('name');
      setCategories(data || []);
    }
    fetchCategories();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (localSearch) {
      params.set('search', localSearch);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  const handleCategoryChange = (categorySlug: string) => {
    const params = new URLSearchParams(searchParams);
    if (categorySlug) {
      params.set('category', categorySlug);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
  };

  const handleSortChange = (sort: SortOption) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', sort);
    setSearchParams(params);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    setLocalSearch('');
  };

  const hasActiveFilters = selectedCategory || searchQuery || featured || bestseller;

  const selectedCategoryName = useMemo(() => {
    return categories.find((c) => c.slug === selectedCategory)?.name || '';
  }, [categories, selectedCategory]);

  return (
    <div className="animate-fade-in">
      <section className="bg-gray-900 text-white py-8 md:py-12">
        <div className="container-custom">
          <h1 className="text-2xl md:text-3xl font-bold">
            {selectedCategoryName || 'All Products'}
          </h1>
          <p className="text-gray-400 mt-2">
            Discover our complete range of kitchen tools and equipment
          </p>
        </div>
      </section>
      <section className="bg-white border-b border-gray-200 sticky top-16 md:top-20 z-40">
        <div className="container-custom py-4">
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-600 text-sm font-medium hover:text-primary-700"
                >
                  Search
                </button>
              </div>
            </form>
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {sortOptions.find((s) => s.value === sortBy)?.label || 'Sort'}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showFilters && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowFilters(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-4 animate-slide-down">
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Category</h3>
                      <select
                        value={selectedCategory}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.slug}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Sort By</h3>
                      <div className="space-y-1">
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleSortChange(option.value)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              sortBy === option.value
                                ? 'bg-primary-50 text-primary-600'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-sm text-gray-500">Active filters:</span>
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm">
                  {selectedCategoryName}
                  <button onClick={() => handleCategoryChange('')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm">
                  &quot;{searchQuery}&quot;
                  <button onClick={() => {
                    setLocalSearch('');
                    const params = new URLSearchParams(searchParams);
                    params.delete('search');
                    setSearchParams(params);
                  }}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {featured && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm">
                  Featured
                  <button onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.delete('featured');
                    setSearchParams(params);
                  }}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {bestseller && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm">
                  Bestseller
                  <button onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.delete('bestseller');
                    setSearchParams(params);
                  }}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-primary-600 underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="py-8 md:py-12 bg-gray-50">
        <div className="container-custom">
          <p className="text-sm text-gray-500 mb-6">
            {loading ? 'Loading...' : `${products.length} products found`}
          </p>

          <ProductGrid products={products} loading={loading} />
        </div>
      </section>
    </div>
  );
}
