import { supabase } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

type HomepageDbClient = SupabaseClient;

export interface HomepageSection {
  id: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  is_enabled: boolean;
  display_order: number;
  background_theme: string;
  alignment: string;
  content: Record<string, any>;
}

export interface HomepageFeature {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  display_order: number;
  is_enabled: boolean;
}

export interface HomepageCategoryPick {
  id: string;
  category_id: string;
  display_order: number;
  is_enabled: boolean;
  image_override_url: string | null;
}

export interface HomepageProductPick {
  id: string;
  product_id: string;
  section_key: 'featured_products' | 'best_sellers';
  display_order: number;
  is_enabled: boolean;
}

export async function getHomepageSections(client: HomepageDbClient = supabase): Promise<HomepageSection[]> {
  const { data, error } = await client
    .from('homepage_sections')
    .select('*')
    .order('display_order');

  if (error) throw error;
  return data || [];
}

export async function updateHomepageSection(
  section_key: string,
  patch: Partial<Omit<HomepageSection, 'id' | 'section_key'>>,
  client: HomepageDbClient = supabase
) {
  const { error } = await client
    .from('homepage_sections')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('section_key', section_key);

  if (error) throw error;
}

export async function reorderSections(
  order: { section_key: string; display_order: number }[],
  client: HomepageDbClient = supabase
) {
  for (const { section_key, display_order } of order) {
    const { error } = await client
      .from('homepage_sections')
      .update({ display_order })
      .eq('section_key', section_key);

    if (error) throw error;
  }
}

export async function getHomepageFeatures(client: HomepageDbClient = supabase): Promise<HomepageFeature[]> {
  const { data, error } = await client
    .from('homepage_features')
    .select('*')
    .order('display_order');

  if (error) throw error;
  return data || [];
}

export async function upsertHomepageFeature(
  feature: Partial<HomepageFeature> & { id?: string },
  client: HomepageDbClient = supabase
) {
  const { error } = await client
    .from('homepage_features')
    .upsert(feature);

  if (error) throw error;
}

export async function deleteHomepageFeature(id: string, client: HomepageDbClient = supabase) {
  const { error } = await client
    .from('homepage_features')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getHomepageCategoryPicks(client: HomepageDbClient = supabase): Promise<HomepageCategoryPick[]> {
  const { data, error } = await client
    .from('homepage_categories')
    .select('*')
    .order('display_order');

  if (error) throw error;
  return data || [];
}

export async function setHomepageCategoryPicks(
  picks: Partial<HomepageCategoryPick>[],
  client: HomepageDbClient = supabase
) {
  const { error } = await client
    .from('homepage_categories')
    .upsert(picks, { onConflict: 'category_id' });

  if (error) throw error;
}

export async function removeHomepageCategoryPick(category_id: string, client: HomepageDbClient = supabase) {
  const { error } = await client
    .from('homepage_categories')
    .delete()
    .eq('category_id', category_id);

  if (error) throw error;
}

export async function getHomepageProductPicks(
  section_key: 'featured_products' | 'best_sellers',
  client: HomepageDbClient = supabase
): Promise<HomepageProductPick[]> {
  const { data, error } = await client
    .from('homepage_products')
    .select('*')
    .eq('section_key', section_key)
    .order('display_order');

  if (error) throw error;
  return data || [];
}

export async function setHomepageProductPicks(
  picks: Partial<HomepageProductPick>[],
  client: HomepageDbClient = supabase
) {
  const { error } = await client
    .from('homepage_products')
    .upsert(picks, {
      onConflict: 'product_id,section_key',
    });

  if (error) throw error;
}

export async function removeHomepageProductPick(
  product_id: string,
  section_key: string,
  client: HomepageDbClient = supabase
) {
  const { error } = await client
    .from('homepage_products')
    .delete()
    .eq('product_id', product_id)
    .eq('section_key', section_key);

  if (error) throw error;
}

export async function uploadHomepageImage(
  file: File,
  prefix: string,
  client: HomepageDbClient = supabase
): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${prefix}-${Date.now()}.${ext}`;

  const { error } = await client.storage
    .from('homepage-images')
    .upload(path, file, {
      upsert: true,
    });

  if (error) throw error;

  const { data } = client.storage
    .from('homepage-images')
    .getPublicUrl(path);

  return data.publicUrl;
}

export const THEME_CLASSES: Record<string, string> = {
  white: 'bg-white',
  light_gray: 'bg-gray-50',
  dark: 'bg-gray-900 text-white',
  primary: 'bg-primary-600 text-white',
};

export const ALIGN_CLASSES: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
};