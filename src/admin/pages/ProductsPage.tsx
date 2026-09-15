import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabaseAdmin as supabase } from "../../lib/supabaseAdmin";
import { deleteProduct } from "../../lib/products";
import { getCategories } from "../../lib/categories";
import {
  Pencil, Trash2, Plus, Search, AlertCircle, RefreshCw,
  ExternalLink, ChevronLeft, ChevronRight, Package,
} from "lucide-react";
import { AddProductModal } from "../components/AddProductModal";

const LOW_STOCK_THRESHOLD = 10;
const PAGE_SIZES = [10, 20, 50];

type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

function getStockStatus(qty: number): StockStatus {
  if (qty <= 0) return "out-of-stock";
  if (qty <= LOW_STOCK_THRESHOLD) return "low-stock";
  return "in-stock";
}

function StockBadge({ qty }: { qty: number }) {
  const status = getStockStatus(qty);
  const styles: Record<StockStatus, string> = {
    "in-stock": "bg-green-50 text-green-700 border-green-200",
    "low-stock": "bg-amber-50 text-amber-700 border-amber-200",
    "out-of-stock": "bg-red-50 text-red-700 border-red-200",
  };
  const labels: Record<StockStatus, string> = {
    "in-stock": "In Stock",
    "low-stock": "Low Stock",
    "out-of-stock": "Out of Stock",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "in-stock" ? "bg-green-500" : status === "low-stock" ? "bg-amber-500" : "bg-red-500"}`} />
      {labels[status]}
    </span>
  );
}

function ProductThumb({ src, name }: { src?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="w-14 h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
        <Package size={20} className="text-gray-300" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      className="w-14 h-14 rounded-lg object-cover border border-gray-200 flex-shrink-0"
    />
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
          <div className="w-14 h-14 rounded-lg bg-gray-200 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-1/5" />
          </div>
          <div className="hidden sm:block h-4 w-16 bg-gray-200 rounded" />
          <div className="hidden sm:block h-4 w-10 bg-gray-200 rounded" />
          <div className="h-6 w-20 bg-gray-200 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function ProductsPage() {
  const [openModal, setOpenModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "in-stock" | "low-stock" | "out-of-stock">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProducts();
    getCategories().then(setCategories).catch(() => {});
  }, []);

  async function fetchProducts() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("products")
      .select(`*, categories ( id, name )`);

    if (error) {
      setError(error.message || "Failed to load products.");
      setLoading(false);
      return;
    }
    setProducts(data || []);
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete product");
    } finally {
      setDeleting(false);
    }
  }

  function qtyOf(product: any): number {
    return Number(product.stock ?? product.stock_quantity ?? 0);
  }

  const summary = useMemo(() => {
    const total = products.length;
    const outOfStock = products.filter((p) => qtyOf(p) <= 0).length;
    const lowStock = products.filter((p) => { const q = qtyOf(p); return q > 0 && q <= LOW_STOCK_THRESHOLD; }).length;
    const active = total - outOfStock;
    const inventoryValue = products.reduce((sum, p) => sum + (Number(p.price) || 0) * qtyOf(p), 0);
    return { total, active, outOfStock, lowStock, inventoryValue };
  }, [products]);
  const processed = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = products.filter((product) => {
      const matchesSearch =
        !q ||
        product.name?.toLowerCase().includes(q) ||
        product.categories?.name?.toLowerCase().includes(q) ||
        String(product.id).toLowerCase().includes(q);

      const qty = qtyOf(product);
      const status = getStockStatus(qty);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && qty > 0) ||
        (statusFilter === "inactive" && qty <= 0) ||
        statusFilter === status;

      const matchesCategory = categoryFilter === "all" || product.category_id === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "name-asc": return (a.name || "").localeCompare(b.name || "");
        case "price-asc": return (a.price || 0) - (b.price || 0);
        case "price-desc": return (b.price || 0) - (a.price || 0);
        case "stock-asc": return qtyOf(a) - qtyOf(b);
        case "stock-desc": return qtyOf(b) - qtyOf(a);
        case "oldest": return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case "newest":
        default: return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });

    return list;
  }, [products, search, statusFilter, categoryFilter, sortBy]);

  useEffect(() => { setPage(1); }, [search, statusFilter, categoryFilter, sortBy, pageSize]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = processed.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const hasActiveFilters = search !== "" || statusFilter !== "all" || categoryFilter !== "all";

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
  }

  return (
    <div className="p-4 sm:p-8">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Products</h1>
          <p className="text-gray-500 mt-1">Manage all your products</p>
        </div>
        <button
          onClick={() => { setSelectedProduct(null); setOpenModal(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg flex items-center justify-center gap-2 flex-shrink-0"
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500">Total Products</p>
          <p className="text-xl font-bold mt-1">{summary.total}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500">Active</p>
          <p className="text-xl font-bold mt-1 text-green-600">{summary.active}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500">Low Stock</p>
          <p className="text-xl font-bold mt-1 text-amber-600">{summary.lowStock}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500">Out of Stock</p>
          <p className="text-xl font-bold mt-1 text-red-600">{summary.outOfStock}</p>
        </div>
        <div className="bg-white rounded-xl border p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500">Inventory Value</p>
          <p className="text-xl font-bold mt-1">₹{summary.inventoryValue.toLocaleString("en-IN")}</p>
        </div>
      </div>

          <div className="bg-white rounded-xl border p-4 mb-4 space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, category, or ID..."
            className="w-full border rounded-lg pl-10 pr-4 py-2.5"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {[
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
            { value: "in-stock", label: "In Stock" },
            { value: "low-stock", label: "Low Stock" },
            { value: "out-of-stock", label: "Out of Stock" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                statusFilter === f.value ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-0"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-0"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="name-asc">Sort: Name (A–Z)</option>
            <option value="price-asc">Sort: Price (Low → High)</option>
            <option value="price-desc">Sort: Price (High → Low)</option>
            <option value="stock-asc">Sort: Stock (Low → High)</option>
            <option value="stock-desc">Sort: Stock (High → Low)</option>
          </select>
        </div>
      </div>
      <div className="flex items-center justify-between mb-3 text-sm text-gray-500 flex-wrap gap-2">
        <p>
          {loading ? "Loading..." : `Showing ${paginated.length ? (currentPage - 1) * pageSize + 1 : 0}-${(currentPage - 1) * pageSize + paginated.length} of ${processed.length} products`}
        </p>
        {!loading && !error && processed.length > 0 && (
          <select
            className="border rounded-lg px-2 py-1 text-xs"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} / page</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        {loading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-4">
            <AlertCircle className="text-red-500" size={32} />
            <p className="text-gray-700 font-medium">Couldn't load products</p>
            <p className="text-gray-500 text-sm">{error}</p>
            <button
              onClick={fetchProducts}
              className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : processed.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-4">
            <Package className="text-gray-300" size={36} />
            <p className="text-gray-700 font-medium">No products found</p>
            <p className="text-gray-500 text-sm">Try adjusting your search or filters.</p>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <button onClick={clearFilters} className="px-4 py-2 rounded-lg text-sm border hover:bg-gray-50">
                  Clear filters
                </button>
              )}
              <button
                onClick={() => { setSelectedProduct(null); setOpenModal(true); }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
              >
                <Plus size={14} /> Add Product
              </button>
            </div>
          </div>
        ) : (
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-4">Image</th>
                <th className="text-left p-4">Product</th>
                <th className="text-left p-4">Category</th>
                <th className="text-left p-4">Price</th>
                <th className="text-left p-4">Stock</th>
                <th className="text-left p-4">Status</th>
                <th className="text-center p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((product) => {
                const qty = qtyOf(product);
                return (
                  <tr key={product.id} className="border-t hover:bg-gray-50">
                    <td className="p-4">
                      <ProductThumb src={product.image} name={product.name} />
                    </td>
                    <td className="p-4 font-medium max-w-[200px] truncate" title={product.name}>
                      {product.name}
                    </td>
                    <td className="p-4 text-gray-600">{product.categories?.name || "—"}</td>
                    <td className="p-4 font-medium">₹{Number(product.price).toLocaleString("en-IN")}</td>
                    <td className="p-4">{qty}</td>
                    <td className="p-4"><StockBadge qty={qty} /></td>
                    <td className="p-4">
                      <div className="flex justify-center gap-3">
                        {product.slug && (
                          <Link
                            to={`/product/${product.slug}`}
                            target="_blank"
                            title="View on storefront"
                            className="text-gray-400 hover:text-gray-700"
                          >
                            <ExternalLink size={18} />
                          </Link>
                        )}
                        <button
                          onClick={() => { setSelectedProduct(product); setOpenModal(true); }}
                          title="Edit product"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(product)}
                          title="Delete product"
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && processed.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border disabled:opacity-30 hover:bg-gray-50"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-600 px-2">Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border disabled:opacity-30 hover:bg-gray-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <AddProductModal
        open={openModal}
        product={selectedProduct}
        onClose={() => {
          setOpenModal(false);
          fetchProducts();
        }}
      />
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <p className="font-semibold mb-1">Delete "{deleteTarget.name}"?</p>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 border rounded-lg py-2.5 font-medium hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 font-medium disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}