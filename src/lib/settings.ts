import { supabase } from "./supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

// Shared between public pages (Footer, Terms/Privacy/etc - read-only) and
// the Admin Panel (read + write + admin password change). Same reasoning
// as reviews.ts: every function takes an optional `client`, defaulting to
// the customer client for public reads, with admin/pages/SettingsPage.tsx
// passing `supabaseAdmin` explicitly for every admin call.

export async function getSettings(client: SupabaseClient = supabase) {
  const { data, error } = await client
    .from("settings")
    .select("*")
    .single();

  if (error) throw error;

  return data;
}

export async function updateSettings(settings: any, client: SupabaseClient = supabase) {
  const { data, error } = await client
    .from("settings")
    .update(settings)
    .eq("id", settings.id)
    .select();

  if (error) throw error;

  return data;
}

export async function uploadPaymentQR(file: File, client: SupabaseClient = supabase) {
  const fileName = `payment-qr-${Date.now()}`;

  const { error } = await client.storage
    .from("store-assets")
    .upload(fileName, file);

  if (error) throw error;

  return client.storage
    .from("store-assets")
    .getPublicUrl(fileName).data.publicUrl;
}

// Changes the password of whichever account is currently signed in on the
// client passed in. Always called from the Admin Panel with supabaseAdmin,
// so this only ever updates the ADMIN's own auth user - never a customer's.
export async function changeAdminPassword(newPassword: string, client: SupabaseClient = supabase) {
  const { error } = await client.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
