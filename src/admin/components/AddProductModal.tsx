import { X, Loader2, Check, AlertCircle, ArrowUp, ArrowDown, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect, useRef, ChangeEvent } from "react";
import {
  addProduct,
  updateProduct,
  uploadProductImage,
  uploadGalleryImages,
  getProductImages,
  deleteProductImage,
  updateGalleryImage,
  deleteProductImageFile,
  reorderGalleryImages,
} from "../../lib/products";
import { getCategories } from "../../lib/categories";
import { ImageCropper } from "./ImageCropper";
interface Props {
  open: boolean;
  onClose: () => void;
  product?: any;
}
const DESCRIPTION_LIMIT = 1000;
type Banner = { type: "success" | "error"; text: string } | null;
type CropTarget =
  | { kind: "thumbnail"; file: File }
  | { kind: "new-gallery"; file: File }
  | { kind: "edit-gallery"; file: File; imageId: string; oldUrl: string };
export function AddProductModal({ open, onClose, product }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [discount, setDiscount] = useState("0");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [thumbnailDeleted, setThumbnailDeleted] = useState(false);
  const [galleryPending, setGalleryPending] = useState<{ id: string; blob: Blob; preview: string }[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<Banner>(null);
  const [saving, setSaving] = useState(false);
  const [savingThumb, setSavingThumb] = useState(false);
  const [busyImageId, setBusyImageId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteThumb, setConfirmDeleteThumb] = useState(false);
  const pendingQueue = useRef<File[]>([]);
  useEffect(() => {
    async function loadProductData() {
      if (product) {
        setName(product.name || "");
        setCategory(product.category_id || "");
        setPrice(String(product.price ?? ""));
        setStock(String(product.stock ?? product.stock_quantity ?? 0));
        setDiscount(String(product.discount_percent ?? 0));
        setDescription(product.description || "");
        setThumbnailPreview(product.image || "");
        setThumbnailBlob(null);
        setThumbnailDeleted(false);
        try {
          const images = await getProductImages(product.id);
          setExistingImages(images || []);
        } catch (err) {
          console.error("Failed to load existing images", err);
        }
      } else {
        setName("");
        setCategory("");
        setPrice("");
        setStock("");
        setDiscount("0");
        setDescription("");
        setThumbnailPreview("");
        setThumbnailBlob(null);
        setThumbnailDeleted(false);
        setExistingImages([]);
      }
      setGalleryPending([]);
      setErrors({});
      setBanner(null);
    }
    loadProductData();
  }, [product, open]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setCategories((await getCategories()) || []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchCategories();
  }, []);
  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Product name is required.";
    const priceNum = Number(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) next.price = "Enter a valid positive price.";
    const stockNum = Number(stock);
    if (stock === "" || isNaN(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) next.stock = "Enter a valid non-negative stock number.";
    if (!category) next.category = "Category is required.";
    const discountNum = Number(discount);
    if (discount !== "" && (isNaN(discountNum) || discountNum < 0 || discountNum > 100)) next.discount = "Discount must be between 0 and 100.";
    if (description.length > DESCRIPTION_LIMIT) next.description = `Description must be under ${DESCRIPTION_LIMIT} characters.`;
    setErrors(next);
    return Object.keys(next).length === 0;
  }
  function onThumbnailFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropTarget({ kind: "thumbnail", file });
    e.target.value = "";
  }
  function onAddGalleryFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    if (files.length === 0) return;
    setCropTarget({ kind: "new-gallery", file: files[0] });
    if (files.length > 1) {
      pendingQueue.current = files.slice(1);
    }
  }
  function onEditGalleryFile(img: any, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCropTarget({ kind: "edit-gallery", file, imageId: img.id, oldUrl: img.image_url });
  }
  function handleCropCancel() {
    setCropTarget(null);
    pendingQueue.current = [];
  }
  async function handleCropSave(blob: Blob) {
    const target = cropTarget;
    setCropTarget(null);
    if (!target) return;
    if (target.kind === "thumbnail") {
      setThumbnailBlob(blob);
      setThumbnailPreview(URL.createObjectURL(blob));
      setThumbnailDeleted(false);
      return;
    }
    if (target.kind === "new-gallery") {
      const id = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setGalleryPending((prev) => [...prev, { id, blob, preview: URL.createObjectURL(blob) }]);
      if (pendingQueue.current.length > 0) {
        const nextFile = pendingQueue.current.shift() as File;
        setCropTarget({ kind: "new-gallery", file: nextFile });
      }
      return;
    }
    if (target.kind === "edit-gallery") {
      setBusyImageId(target.imageId);
      try {
        const newUrl = await uploadProductImage(blob);
        await updateGalleryImage(target.imageId, newUrl, target.oldUrl);
        setExistingImages((prev) => prev.map((i) => (i.id === target.imageId ? { ...i, image_url: newUrl } : i)));
        setBanner({ type: "success", text: "Image updated." });
      } catch (err: any) {
        setBanner({ type: "error", text: `Failed to update image: ${err.message || err}` });
      } finally {
        setBusyImageId(null);
      }
    }
  }
  function removePendingGallery(id: string) {
    setGalleryPending((prev) => prev.filter((p) => p.id !== id));
  }
  async function saveThumbnailNow() {
    if (!product?.id) {
      setBanner({ type: "error", text: "Save the product first, then edit the thumbnail." });
      return;
    }
    if (!thumbnailBlob) return;
    setSavingThumb(true);
    try {
      const oldUrl = product.image;
      const url = await uploadProductImage(thumbnailBlob);
      await updateProduct(product.id, { ...product, image: url, stock: Number(stock), price: Number(price), category_id: category, name, slug: name.toLowerCase().replace(/\s+/g, "-"), discount_percent: Number(discount), description });
      if (oldUrl) await deleteProductImageFile(oldUrl);
      product.image = url;
      setThumbnailBlob(null);
      setBanner({ type: "success", text: "Thumbnail saved." });
    } catch (err: any) {
      setBanner({ type: "error", text: `Failed to save thumbnail: ${err.message || err}` });
    } finally {
      setSavingThumb(false);
    }
  }
  function cancelThumbnailChange() {
    setThumbnailBlob(null);
    setThumbnailPreview(product?.image || "");
    setThumbnailDeleted(false);
  }
  async function confirmDeleteThumbnail() {
    setConfirmDeleteThumb(false);
    if (product?.id) {
      setSavingThumb(true);
      try {
        await updateProduct(product.id, { ...product, image: "", stock: Number(stock), price: Number(price), category_id: category, name, slug: name.toLowerCase().replace(/\s+/g, "-"), discount_percent: Number(discount), description });
        if (product.image) await deleteProductImageFile(product.image);
        product.image = "";
        setBanner({ type: "success", text: "Thumbnail deleted." });
      } catch (err: any) {
        setBanner({ type: "error", text: `Failed to delete thumbnail: ${err.message || err}` });
      } finally {
        setSavingThumb(false);
      }
    }
    setThumbnailPreview("");
    setThumbnailBlob(null);
    setThumbnailDeleted(true);
  }
  async function confirmDeleteGalleryImage() {
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    if (!id) return;
    const img = existingImages.find((i) => i.id === id);
    setBusyImageId(id);
    try {
      await deleteProductImage(id, img?.image_url);
      setExistingImages((prev) => prev.filter((i) => i.id !== id));
      setBanner({ type: "success", text: "Image deleted." });
    } catch (err: any) {
      setBanner({ type: "error", text: `Failed to delete image: ${err.message || err}` });
    } finally {
      setBusyImageId(null);
    }
  }
  async function moveGalleryImage(index: number, dir: "up" | "down") {
    const swapWith = dir === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= existingImages.length) return;
    const list = [...existingImages];
    [list[index], list[swapWith]] = [list[swapWith], list[index]];
    setExistingImages(list);
    try {
      await reorderGalleryImages([
        { id: list[index].id, display_order: index },
        { id: list[swapWith].id, display_order: swapWith },
      ]);
    } catch (err: any) {
      setBanner({ type: "error", text: `Failed to save order: ${err.message || err}` });
    }
  }
  async function handleSaveProduct() {
    setBanner(null);
    if (!validate()) return;
    setSaving(true);
    try {
      let imageUrl = product?.image || "";
      if (thumbnailDeleted) imageUrl = "";
      if (thumbnailBlob) imageUrl = await uploadProductImage(thumbnailBlob);
      const productData = {
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        category_id: category,
        price: Number(price),
        stock: Number(stock),
        discount_percent: Number(discount || 0),
        description,
        image: imageUrl,
      };
      let targetProductId = product?.id;
      if (product) {
        await updateProduct(product.id, productData);
      } else {
        const newProduct = await addProduct(productData);
        targetProductId = newProduct?.[0]?.id;
      }
      if (galleryPending.length > 0 && targetProductId) {
        await uploadGalleryImages(targetProductId, galleryPending.map((g) => g.blob));
      }
      setBanner({ type: "success", text: product ? "Product updated successfully." : "Product added successfully." });
      setTimeout(() => onClose(), 600);
    } catch (err: any) {
      console.error(err);
      setBanner({ type: "error", text: `Failed to save product: ${err.message || JSON.stringify(err)}` });
    } finally {
      setSaving(false);
    }
  }
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-[700px] max-h-[90vh] overflow-y-auto p-5 md:p-8 shadow-xl my-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{product ? "Edit Product" : "Add Product"}</h2>
          <button onClick={onClose} type="button"><X /></button>
        </div>

        {banner && (
          <div className={`mb-4 rounded-lg text-sm px-4 py-2.5 flex items-center gap-2 ${banner.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {banner.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
            {banner.text}
          </div>
        )}
        <div className="border-b pb-5">
          <h3 className="font-semibold text-lg mb-4">Product Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <input
                className={`border rounded-lg p-3 w-full ${errors.name ? "border-red-400" : ""}`}
                placeholder="Product Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <input
                className={`border rounded-lg p-3 w-full ${errors.price ? "border-red-400" : ""}`}
                placeholder="Price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              {errors.price && <p className="text-red-600 text-xs mt-1">{errors.price}</p>}
            </div>

            <div>
              <input
                className={`border rounded-lg p-3 w-full ${errors.stock ? "border-red-400" : ""}`}
                placeholder="Stock"
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
              {errors.stock && <p className="text-red-600 text-xs mt-1">{errors.stock}</p>}
            </div>

            <div>
              <select
                className={`border rounded-lg p-3 w-full ${errors.category ? "border-red-400" : ""}`}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select Category</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-600 text-xs mt-1">{errors.category}</p>}
            </div>

            <div>
              <input
                className={`border rounded-lg p-3 w-full ${errors.discount ? "border-red-400" : ""}`}
                placeholder="Discount %"
                type="number"
                min="0"
                max="100"
                step="1"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
              {errors.discount && <p className="text-red-600 text-xs mt-1">{errors.discount}</p>}
            </div>
          </div>

          <div className="mt-5">
            <textarea
              className={`border rounded-lg p-3 w-full ${errors.description ? "border-red-400" : ""}`}
              rows={5}
              placeholder="Product Description"
              maxLength={DESCRIPTION_LIMIT}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex justify-between text-xs mt-1">
              <span className="text-red-600">{errors.description}</span>
              <span className="text-gray-400">{description.length}/{DESCRIPTION_LIMIT}</span>
            </div>
          </div>
        </div>
        <div className="mt-5 border-b pb-5">
          <label className="font-semibold text-lg">Thumbnail Image</label>
          <p className="text-sm text-gray-500 mb-4">The main product image displayed on the store front.</p>

          {thumbnailPreview ? (
            <div className="space-y-3">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 group">
                <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover rounded-lg border-2 border-gray-200 shadow-sm" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2">
                  <label htmlFor="edit-thumbnail" className="cursor-pointer bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 w-24 text-center font-medium">
                    Replace
                  </label>
                  <input id="edit-thumbnail" type="file" accept="image/*" className="hidden" onChange={onThumbnailFile} />
                  <button type="button" onClick={() => setConfirmDeleteThumb(true)} className="bg-red-600 text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 w-24 font-medium">
                    Delete
                  </button>
                </div>
              </div>

              {thumbnailBlob && (
                <div className="flex flex-wrap gap-2">
                  {product?.id && (
                    <button
                      type="button"
                      onClick={saveThumbnailNow}
                      disabled={savingThumb}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-60"
                    >
                      {savingThumb && <Loader2 size={14} className="animate-spin" />} Save Image
                    </button>
                  )}
                  <button type="button" onClick={cancelThumbnailChange} className="px-4 py-2 rounded-lg text-sm border hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ) : (
            <label htmlFor="add-thumbnail" className="cursor-pointer inline-block bg-gray-100 border-2 border-dashed border-gray-300 text-gray-600 px-6 py-8 rounded-lg hover:bg-gray-200 transition-colors text-center w-32 sm:w-40">
              <span className="block text-2xl mb-1">+</span>
              <span className="text-sm font-medium">Choose File</span>
              <input id="add-thumbnail" type="file" accept="image/*" className="hidden" onChange={onThumbnailFile} />
            </label>
          )}
        </div>

        {/* Gallery */}
        <div className="mt-5 border-b pb-5">
          <label className="font-semibold text-lg">Gallery Images</label>
          <p className="text-sm text-gray-500 mb-4">Additional angles and details.</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {existingImages.map((img, idx) => (
              <div key={img.id} className="relative aspect-square group">
                <img src={img.image_url} className="w-full h-full object-cover rounded-lg border-2 border-blue-100 shadow-sm" alt="Gallery item" />
                {busyImageId === img.id && (
                  <div className="absolute inset-0 bg-white/70 rounded-lg flex items-center justify-center">
                    <Loader2 size={20} className="animate-spin text-blue-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-1.5 p-1">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => moveGalleryImage(idx, "up")} disabled={idx === 0} className="bg-white/90 rounded p-1 disabled:opacity-30">
                      <ArrowUp size={12} />
                    </button>
                    <button type="button" onClick={() => moveGalleryImage(idx, "down")} disabled={idx === existingImages.length - 1} className="bg-white/90 rounded p-1 disabled:opacity-30">
                      <ArrowDown size={12} />
                    </button>
                  </div>
                  <label htmlFor={`edit-gallery-${img.id}`} className="cursor-pointer bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 w-16 text-center flex items-center justify-center gap-1">
                    <Pencil size={11} /> Edit
                  </label>
                  <input id={`edit-gallery-${img.id}`} type="file" accept="image/*" className="hidden" onChange={(e) => onEditGalleryFile(img, e)} />
                  <button type="button" onClick={() => setConfirmDeleteId(img.id)} className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 w-16 flex items-center justify-center gap-1">
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            ))}

            {galleryPending.map((p) => (
              <div key={p.id} className="relative aspect-square">
                <img src={p.preview} className="w-full h-full object-cover rounded-lg border-2 border-green-200" alt="Pending upload" />
                <div className="absolute top-1 left-1 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded shadow">New</div>
                <button
                  type="button"
                  onClick={() => removePendingGallery(p.id)}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 text-xs shadow-md flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            <div className="aspect-square">
              <label htmlFor="add-gallery" className="cursor-pointer w-full h-full flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="text-2xl mb-1">+</span>
                <span className="text-xs font-medium">Add Image</span>
              </label>
              <input id="add-gallery" type="file" multiple accept="image/*" className="hidden" onChange={onAddGalleryFiles} />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">New gallery images upload when you click "Save Product" below.</p>
        </div>

        <div className="flex flex-wrap gap-3 mt-5">
          <button
            onClick={handleSaveProduct}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg disabled:opacity-60"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Saving..." : "Save Product"}
          </button>
          <button onClick={onClose} className="px-6 py-3 rounded-lg border hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>

      {cropTarget && (
        <ImageCropper
          file={cropTarget.file}
          aspectRatio={1}
          onCancel={handleCropCancel}
          onSave={handleCropSave}
        />
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <p className="font-semibold mb-1">Delete this image?</p>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 border rounded-lg py-2.5 font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDeleteGalleryImage} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteThumb && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <p className="font-semibold mb-1">Delete this image?</p>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteThumb(false)} className="flex-1 border rounded-lg py-2.5 font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDeleteThumbnail} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}