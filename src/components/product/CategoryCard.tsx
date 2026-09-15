import { Link } from 'react-router-dom';
import type { Category } from '../../types';

interface CategoryCardProps {
  category: Category;
  productCount?: number;
}

export function CategoryCard({ category, productCount }: CategoryCardProps) {
  return (
    <Link to={`/products?category=${category.slug}`} className="group">
      <div className="card-hover relative overflow-hidden aspect-square">
        {category.image_url ? (
          <img
            src={category.image_url}
            alt={category.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-50" />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
          <h3 className="text-lg md:text-xl font-bold group-hover:text-primary-300 transition-colors">
            {category.name}
          </h3>
          {category.description && (
            <p className="text-sm text-gray-300 mt-1 line-clamp-2">{category.description}</p>
          )}
          {productCount !== undefined && (
            <p className="text-xs text-gray-400 mt-2">{productCount} products</p>
          )}
        </div>
      </div>
    </Link>
  );
}
