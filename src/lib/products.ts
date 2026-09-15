import { supabaseAdmin as supabase } from "./supabaseAdmin";

const IMAGE_BUCKET = "product-images";

function storagePathFromUrl(url: string): string | null {
  const marker = `/object/public/${IMAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

async function deleteStorageObject(url: string) {
  const path = storagePathFromUrl(url);
  if (!path) return;
  await supabase.storage.from(IMAGE_BUCKET).remove([path]);
}

// Add Product
export async function addProduct(product: any) {
  const { data, error } = await supabase
    .from("products")
    .insert([
      {
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        discount_percent: product.discount_percent,
        stock_quantity: product.stock,
        category_id: product.category_id,
        image: product.image,
      },
    ])
    .select();

  if (error) throw error;
  return data;
}

// Delete Product
export async function deleteProduct(id: string) {
  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .select();

  if (error) throw error;
  return data;
}

// Update Product
export async function updateProduct(id: string, product: any) {
  const { data, error } = await supabase
    .from("products")
    .update({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      discount_percent: product.discount_percent,
      stock: product.stock,
      stock_quantity: product.stock,
      category_id: product.category_id,
      image: product.image,
    })
    .eq("id", id)
    .select();

  if (error) throw error;
  return data;
}

// Upload Product Image (thumbnail or gallery) - accepts File or cropped Blob
export async function uploadProductImage(file: File | Blob) {
  const ext = file instanceof File ? file.name.split(".").pop() || "jpg" : "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(fileName, file, { contentType: file.type || "image/jpeg" });

  if (error) throw error;

  const { data } = supabase.storage
    .from(IMAGE_BUCKET)
    .getPublicUrl(fileName);

  return data.publicUrl;
}

// Delete the storage object behind a thumbnail/product image URL
export async function deleteProductImageFile(imageUrl: string) {
  if (!imageUrl) return;
  await deleteStorageObject(imageUrl);
}

// Upload Gallery Images (each entry already-cropped Blob or File)
export async function uploadGalleryImages(
  productId: string,
  files: (File | Blob)[]
) {
  const { data: existing } = await supabase
    .from("product_images")
    .select("display_order")
    .eq("product_id", productId)
    .order("display_order", { ascending: false })
    .limit(1);

  let nextOrder = existing && existing.length ? existing[0].display_order + 1 : 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const url = await uploadProductImage(file);

    const { error: insertError } = await supabase
      .from("product_images")
      .insert({
        product_id: productId,
        image_url: url,
        is_primary: false,
        display_order: nextOrder,
      });

    if (insertError) throw insertError;
    nextOrder++;
  }
}

// Get Product Images
export async function getProductImages(productId: string) {
  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("display_order");

  if (error) throw error;

  return data;
}

// Update Gallery Image (replace URL for one specific row only)
export async function updateGalleryImage(
  imageId: string,
  imageUrl: string,
  oldImageUrl?: string
) {
  const { data, error } = await supabase
    .from("product_images")
    .update({
      image_url: imageUrl,
    })
    .eq("id", imageId)
    .select();

  if (error) throw error;

  if (oldImageUrl && oldImageUrl !== imageUrl) {
    await deleteStorageObject(oldImageUrl);
  }

  return data;
}

// Delete Gallery Image (deletes exactly one row + its storage object)
export async function deleteProductImage(imageId: string, imageUrl?: string) {
  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId);

  if (error) throw error;

  if (imageUrl) {
    await deleteStorageObject(imageUrl);
  }
}

// Persist a new gallery order after drag-and-drop reordering.
// Only touches display_order on the given rows; never changes image identity/URL.
export async function reorderGalleryImages(
  ordered: { id: string; display_order: number }[]
) {
  for (const item of ordered) {
    const { error } = await supabase
      .from("product_images")
      .update({ display_order: item.display_order })
      .eq("id", item.id);
    if (error) throw error;
  }
}