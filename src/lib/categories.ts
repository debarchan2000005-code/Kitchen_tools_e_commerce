import { supabaseAdmin as supabase } from "./supabaseAdmin";

export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) throw error;

  return data;
}

export async function addCategory(category: any) {
  const { data, error } = await supabase
    .from("categories")
    .insert([
      {
        name: category.name,
        slug: category.slug,
        description: category.description,
        image_url: category.image_url,
      },
    ])
    .select();

  if (error) throw error;

  return data;
}

export async function updateCategory(id: string, category: any) {
  const { data, error } = await supabase
    .from("categories")
    .update({
      name: category.name,
      slug: category.slug,
      description: category.description,
      image_url: category.image_url,
    })
    .eq("id", id)
    .select();

  if (error) throw error;

  return data;
}

export async function deleteCategory(id: string) {
  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .select();

  if (error) throw error;

  return data;
}