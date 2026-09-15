import { supabase } from "./supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

// This module is shared between the public storefront (anonymous/customer
// reads + inserts) and the Admin Panel (moderation: list/delete). Every
// function takes an optional `client` so each caller can supply the
// Supabase client that actually holds ITS session:
//   - Customer-facing components (ProductReviews, ReviewForm) call these
//     with no `client` arg -> defaults to the customer client.
//   - Admin screens (admin/pages/ReviewsPage.tsx) pass `supabaseAdmin`
//     explicitly so moderation actions run under the admin's own session.
// This keeps a single shared module without ever routing an admin action
// through the customer client or vice versa.

export async function getReviews(client: SupabaseClient = supabase) {
  const { data, error } = await client
    .from("reviews")
    .select(`
      *,
      products (
        name,
        image
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}

export async function deleteReview(id: string, client: SupabaseClient = supabase) {
  const { error } = await client
    .from("reviews")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getProductReviews(productId: string, client: SupabaseClient = supabase) {
  const { data, error } = await client
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}

export async function addReview(review: any, client: SupabaseClient = supabase) {
  const { data, error } = await client
    .from("reviews")
    .insert([
      {
        product_id: review.product_id,
        reviewer_name: review.reviewer_name,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        is_verified_purchase:
          review.is_verified_purchase,
      },
    ])
    .select();

  if (error) throw error;

  return data;
}
