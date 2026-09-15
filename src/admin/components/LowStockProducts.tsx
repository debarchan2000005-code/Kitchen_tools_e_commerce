import { useEffect, useState } from "react";
import { getLowStockProducts, LOW_STOCK_THRESHOLD } from "../../lib/dashboard";
import { supabaseAdmin as supabase } from "../../lib/supabaseAdmin";

export function LowStockProducts() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    loadProducts();

    const channel = supabase
      .channel("low-stock-products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => loadProducts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadProducts() {
    const data = await getLowStockProducts();
    setProducts(data || []);
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 sm:p-6">
      <div className="flex items-center justify-between mb-5 gap-2">
        <h2 className="text-xl sm:text-2xl font-bold">⚠️ Low Stock Products</h2>
        <span className="text-xs text-gray-400 flex-shrink-0">Threshold: {LOW_STOCK_THRESHOLD}</span>
      </div>

      {products.length === 0 ? (
        <p className="text-gray-500">
          All products are sufficiently stocked.
        </p>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between border-b pb-3 gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={product.image || "https://placehold.co/60x60"}
                  alt={product.name}
                  className="w-12 h-12 rounded-lg object-cover border flex-shrink-0"
                />

                <div className="min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold flex-shrink-0 ${
                  product.stock_quantity === 0
                    ? "bg-red-100 text-red-600"
                    : "bg-orange-100 text-orange-600"
                }`}
              >
                {product.stock_quantity === 0 ? "Out of stock" : `${product.stock_quantity} left`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}