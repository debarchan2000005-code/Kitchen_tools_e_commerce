import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import * as Icons from 'lucide-react';
import { ArrowRight, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProductGrid } from '../components/product/ProductGrid';
import { CategoryCard } from '../components/product/CategoryCard';
import {
  getHomepageSections,
  getHomepageFeatures,
  getHomepageCategoryPicks,
  getHomepageProductPicks,
  THEME_CLASSES,
  ALIGN_CLASSES,
  type HomepageSection,
  type HomepageFeature,
} from '../lib/homepage';
import type { ProductWithDetails, Category } from '../types';

interface HeroContent {
  heading: string;
  highlighted_text: string;
  description: string;
  image_url: string;
  price_badge: string;
  primary_button_text: string;
  primary_button_link: string;
  secondary_button_text: string;
  secondary_button_link: string;
  show_image: boolean;
  show_price_badge: boolean;
  primary_button_enabled: boolean;
  secondary_button_enabled: boolean;
}

const DEFAULT_HERO: HeroContent = {
  heading: 'Premium Kitchen Tools for',
  highlighted_text: 'Professional Chefs',
  description:
    'Discover our curated collection of high-quality cookware, appliances, and utensils. Elevate your cooking experience with professional-grade equipment.',
  image_url: 'https://images.pexels.com/photos/4227055/pexels-photo-4227055.jpeg?auto=compress&cs=tinysrgb&w=800',
  price_badge: 'Starting from Rs. 999',
  primary_button_text: 'Shop Now',
  primary_button_link: '/products',
  secondary_button_text: 'Learn More',
  secondary_button_link: '/about',
  show_image: true,
  show_price_badge: true,
  primary_button_enabled: true,
  secondary_button_enabled: true,
};

function getIcon(name: string) {
  return (Icons as any)[name] || Package;
}

export function HomePage() {
  const shouldReduceMotion = useReducedMotion();

  const revealVariants: Variants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 40 },
    visible: { opacity: 1, y: 0, transition: { duration: shouldReduceMotion ? 0 : 0.5, ease: 'easeOut' } },
  };
  const staggerContainerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: shouldReduceMotion ? 0 : 0.08 } },
  };

  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [features, setFeatures] = useState<HomepageFeature[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithDetails[]>([]);
  const [bestsellerProducts, setBestsellerProducts] = useState<ProductWithDetails[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [hero, setHero] = useState<HeroContent>(DEFAULT_HERO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [
          { data: heroData },
          sectionRows,
          featureRows,
          { data: allCategories },
          categoryPicks,
        ] = await Promise.all([
          supabase.from('homepage_hero').select('*').eq('id', 1).maybeSingle(),
          getHomepageSections(),
          getHomepageFeatures(),
          supabase.from('categories').select('*').order('name'),
          getHomepageCategoryPicks(),
        ]);

        if (heroData) {
          setHero({
            heading: heroData.heading || DEFAULT_HERO.heading,
            highlighted_text: heroData.highlighted_text || DEFAULT_HERO.highlighted_text,
            description: heroData.description || DEFAULT_HERO.description,
            image_url: heroData.image_url || DEFAULT_HERO.image_url,
            price_badge: heroData.price_badge || DEFAULT_HERO.price_badge,
            primary_button_text: heroData.primary_button_text || DEFAULT_HERO.primary_button_text,
            primary_button_link: heroData.primary_button_link || DEFAULT_HERO.primary_button_link,
            secondary_button_text: heroData.secondary_button_text || DEFAULT_HERO.secondary_button_text,
            secondary_button_link: heroData.secondary_button_link || DEFAULT_HERO.secondary_button_link,
            show_image: heroData.show_image ?? true,
            show_price_badge: heroData.show_price_badge ?? true,
            primary_button_enabled: heroData.primary_button_enabled ?? true,
            secondary_button_enabled: heroData.secondary_button_enabled ?? true,
          });
        }

        setSections(sectionRows);
        setFeatures(featureRows.filter((f) => f.is_enabled));

        const enabledPicks = categoryPicks.filter((p) => p.is_enabled);
        if (enabledPicks.length > 0) {
          const byId = new Map((allCategories || []).map((c) => [c.id, c]));
          const picked = enabledPicks
            .sort((a, b) => a.display_order - b.display_order)
            .map((p) => {
              const cat = byId.get(p.category_id);
              if (!cat) return null;
              return p.image_override_url ? { ...cat, image_url: p.image_override_url } : cat;
            })
            .filter(Boolean) as Category[];
          setCategories(picked);
        } else {
          setCategories(allCategories || []);
        }

        const featuredSection = sectionRows.find((s) => s.section_key === 'featured_products');
        const bestSellerSection = sectionRows.find((s) => s.section_key === 'best_sellers');

        if (featuredSection?.content?.display_mode === 'manual') {
          const picks = await getHomepageProductPicks('featured_products');
          const ids = picks.filter((p) => p.is_enabled).sort((a, b) => a.display_order - b.display_order).map((p) => p.product_id);
          if (ids.length) {
            const { data } = await supabase
              .from('products')
              .select('*, category:categories(*), images:product_images(*)')
              .in('id', ids);
            const byId = new Map((data || []).map((p: any) => [p.id, p]));
            setFeaturedProducts(ids.map((id) => byId.get(id)).filter(Boolean) as ProductWithDetails[]);
          }
        } else {
          const { data } = await supabase
            .from('products')
            .select('*, category:categories(*), images:product_images(*)')
            .eq('is_featured', true)
            .limit(featuredSection?.content?.count || 8);
          setFeaturedProducts((data || []) as ProductWithDetails[]);
        }

        if (bestSellerSection?.content?.display_mode === 'manual') {
          const picks = await getHomepageProductPicks('best_sellers');
          const ids = picks.filter((p) => p.is_enabled).sort((a, b) => a.display_order - b.display_order).map((p) => p.product_id);
          if (ids.length) {
            const { data } = await supabase
              .from('products')
              .select('*, category:categories(*), images:product_images(*)')
              .in('id', ids);
            const byId = new Map((data || []).map((p: any) => [p.id, p]));
            setBestsellerProducts(ids.map((id) => byId.get(id)).filter(Boolean) as ProductWithDetails[]);
          }
        } else {
          const { data } = await supabase
            .from('products')
            .select('*, category:categories(*), images:product_images(*)')
            .eq('is_bestseller', true)
            .limit(bestSellerSection?.content?.count || 4);
          setBestsellerProducts((data || []) as ProductWithDetails[]);
        }
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  function sectionOf(key: string) {
    return sections.find((s) => s.section_key === key);
  }
  function isEnabled(key: string) {
    const s = sectionOf(key);
    return s ? s.is_enabled : true;
  }

  const orderedKeys = (sections.length ? sections : [
    { section_key: 'hero' }, { section_key: 'features' }, { section_key: 'categories' },
    { section_key: 'featured_products' }, { section_key: 'best_sellers' },
    { section_key: 'newsletter' }, { section_key: 'contact_cta' },
  ] as HomepageSection[])
    .slice()
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((s) => s.section_key);

  const featuredSection = sectionOf('featured_products');
  const bestSellerSection = sectionOf('best_sellers');
  const categoriesSection = sectionOf('categories');
  const newsletterSection = sectionOf('newsletter');
  const contactSection = sectionOf('contact_cta');

  const renderers: Record<string, () => JSX.Element | null> = {
    hero: () => (
      loading ? (
        <section key="hero" className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-primary-900 overflow-hidden">
          <div className="container-custom relative py-12 md:py-24 lg:py-32">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="space-y-6">
                <div className="h-12 md:h-16 bg-white/10 rounded-lg skeleton w-3/4" />
                <div className="h-10 md:h-14 bg-white/10 rounded-lg skeleton w-2/3" />
                <div className="h-4 bg-white/10 rounded skeleton w-full" />
                <div className="flex gap-4">
                  <div className="h-12 w-32 bg-white/10 rounded-lg skeleton" />
                  <div className="h-12 w-32 bg-white/10 rounded-lg skeleton" />
                </div>
              </div>
              <div className="w-full max-w-md mx-auto h-64 md:h-96 bg-white/10 rounded-2xl skeleton" />
            </div>
          </div>
        </section>
      ) : (
        <section key="hero" className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-primary-900 text-white overflow-hidden">
          <div className="container-custom relative py-12 md:py-24 lg:py-32">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="space-y-6 text-center lg:text-left order-1">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight break-words">
                  {hero.heading}{' '}
                  <span className="text-primary-400">{hero.highlighted_text}</span>
                </h1>
                <p className="text-gray-300 text-base md:text-lg max-w-xl mx-auto lg:mx-0">{hero.description}</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  {hero.primary_button_enabled && (
                    <Link to={hero.primary_button_link} className="btn-primary px-8 py-3 text-base">
                      {hero.primary_button_text}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  )}
                  {hero.secondary_button_enabled && (
                    <Link
                      to={hero.secondary_button_link}
                      className="btn-secondary px-8 py-3 text-base bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      {hero.secondary_button_text}
                    </Link>
                  )}
                </div>
              </div>
              {hero.show_image && (
                <div className="relative order-2 w-full max-w-md mx-auto lg:max-w-none">
                  <img
                    src={hero.image_url}
                    alt={hero.heading}
                    className="w-full h-auto rounded-2xl shadow-2xl"
                  />
                  {hero.show_price_badge && (
                    <div className="absolute bottom-2 left-2 sm:-bottom-4 sm:-left-4 bg-white text-gray-900 p-3 sm:p-4 rounded-xl shadow-lg max-w-[80%]">
                      <p className="text-lg sm:text-2xl font-bold text-primary-600 break-words">{hero.price_badge}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )
    ),

    features: () => features.length === 0 ? null : (
      <motion.section
        key="features"
        className="bg-white border-b border-gray-100"
        variants={revealVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
      >
        <div className="container-custom py-6 md:py-8">
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6" variants={staggerContainerVariants}>
            {features.map((feature) => {
              const Icon = getIcon(feature.icon);
              return (
                <motion.div key={feature.id} variants={revealVariants} className="flex items-center gap-3 md:gap-4 justify-center md:justify-start">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary-600" />
                  </div>
                  <div className="text-center md:text-left min-w-0">
                    <p className="font-semibold text-gray-900 text-sm md:text-base">{feature.title}</p>
                    <p className="text-xs md:text-sm text-gray-500">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.section>
    ),

    categories: () => categories.length === 0 ? null : (
      <motion.section
        key="categories"
        className={`py-12 md:py-16 lg:py-20 ${THEME_CLASSES[categoriesSection?.background_theme || 'white']}`}
        variants={revealVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}
      >
        <div className="container-custom">
          <div className="mb-8 md:mb-12 text-center">
            <h2 className="section-title">{categoriesSection?.title || 'Shop by Category'}</h2>
            {categoriesSection?.subtitle && (
              <p className="text-gray-600 mt-3 max-w-2xl mx-auto">{categoriesSection.subtitle}</p>
            )}
          </div>
          <motion.div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" variants={staggerContainerVariants}>
            {categories.map((category) => (
              <motion.div key={category.id} variants={revealVariants}>
                <CategoryCard category={category} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>
    ),

    featured_products: () => (
      <motion.section
        key="featured_products"
        className="py-12 md:py-16 lg:py-20 bg-gray-50"
        variants={revealVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8 md:mb-12 gap-4">
            <div className="min-w-0">
              <h2 className="section-title">{featuredSection?.title || 'Featured Products'}</h2>
              {featuredSection?.subtitle && <p className="text-gray-600 mt-2">{featuredSection.subtitle}</p>}
            </div>
            {(featuredSection?.content?.show_view_all ?? true) && (
              <Link to={featuredSection?.content?.view_all_link || '/products?featured=true'} className="hidden md:flex items-center text-primary-600 hover:text-primary-700 font-medium flex-shrink-0">
                {featuredSection?.content?.view_all_text || 'View All'}
                <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            )}
          </div>
          <ProductGrid products={featuredProducts} loading={loading} />
          {(featuredSection?.content?.show_view_all ?? true) && (
            <div className="mt-8 text-center md:hidden">
              <Link to={featuredSection?.content?.view_all_link || '/products?featured=true'} className="btn-primary">
                {featuredSection?.content?.view_all_text || 'View All'}
              </Link>
            </div>
          )}
        </div>
      </motion.section>
    ),

    best_sellers: () => bestsellerProducts.length === 0 ? null : (
      <motion.section
        key="best_sellers"
        className="py-12 md:py-16 lg:py-20 bg-white"
        variants={revealVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}
      >
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="section-title mb-6">{bestSellerSection?.title || 'Best Sellers'}</h2>
              <motion.div className="grid sm:grid-cols-2 gap-4" variants={staggerContainerVariants}>
                {bestsellerProducts.slice(0, 4).map((product) => (
                  <motion.div key={product.id} variants={revealVariants}>
                    <Link to={`/product/${product.slug}`} className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                      <div className="w-20 h-20 bg-gray-200 rounded-md flex-shrink-0 overflow-hidden">
                        {(product.image || product.images?.[0]) ? (
                          <img src={product.image || product.images[0].image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">No img</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-primary-600 font-medium uppercase">{product.category?.name}</p>
                        <p className="font-medium text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">{product.name}</p>
                        <p className="font-bold text-gray-900 mt-1">Rs. {product.price.toLocaleString('en-IN')}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
              <Link to={bestSellerSection?.content?.view_all_link || '/products?bestseller=true'} className="btn-primary inline-flex mt-6">
                {bestSellerSection?.content?.view_all_text || 'View All Bestsellers'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
            {(bestSellerSection?.content?.show_image ?? true) && (
              <div className="order-1 lg:order-2 w-full max-w-md mx-auto lg:max-w-none">
                <img
                  src={bestSellerSection?.content?.image_url || 'https://images.pexels.com/photos/4227625/pexels-photo-4227625.jpeg?auto=compress&cs=tinysrgb&w=800'}
                  alt="Kitchen Bestsellers"
                  className="rounded-2xl shadow-lg w-full"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
          </div>
        </div>
      </motion.section>
    ),

    newsletter: () => (
      <motion.section
        key="newsletter"
        className="py-12 md:py-16 lg:py-20 bg-primary-600"
        variants={revealVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
      >
        <div className="container-custom text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{newsletterSection?.title || 'Subscribe to Our Newsletter'}</h2>
          <p className="text-primary-100 mb-8 max-w-xl mx-auto">{newsletterSection?.subtitle}</p>
          <form className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder={newsletterSection?.content?.placeholder || 'Enter your email'}
              className="flex-1 min-w-0 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
              required
            />
            <button type="submit" className="btn-accent px-8 py-3 rounded-lg">
              {newsletterSection?.content?.button_text || 'Subscribe'}
            </button>
          </form>
        </div>
      </motion.section>
    ),

    contact_cta: () => (
      <motion.section
        key="contact_cta"
        className="py-12 md:py-16 lg:py-20 bg-white"
        variants={revealVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
      >
        <div className="container-custom">
          <div className="card bg-gradient-to-r from-gray-900 to-gray-800 p-8 md:p-12 text-center md:text-left">
            <div className="md:flex md:items-center md:justify-between gap-6">
              <div className="text-white mb-6 md:mb-0 min-w-0">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">{contactSection?.title || 'Need Help Choosing?'}</h2>
                <p className="text-gray-300">{contactSection?.subtitle}</p>
              </div>
              <Link to={contactSection?.content?.button_link || '/contact'} className="btn-primary bg-white text-gray-900 hover:bg-gray-100 flex-shrink-0">
                {contactSection?.content?.button_text || 'Contact Us'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </motion.section>
    ),
  };

  return (
    <div className="animate-fade-in">
      {orderedKeys.map((key) => (isEnabled(key) ? renderers[key]?.() : null))}
    </div>
  );
}