import { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { supabaseAdmin as supabase } from '../../lib/supabaseAdmin';
interface HeroForm {
  hero_heading: string;
  hero_description: string;
  hero_button_text: string;
  hero_button_link: string;
  hero_button_enabled: boolean;
  hero_image_url: string;
}

interface StatRow {
  id: string; 
  icon: string;
  value: string;
  title: string;
  description: string;
  display_order: number;
  is_active: boolean;
}

interface ValueRow {
  id: string;
  icon: string;
  title: string;
  description: string;
  display_order: number;
  is_active: boolean;
}

interface MissionForm {
  mission_title: string;
  mission_image_url: string;
  mission_paragraph_1: string;
  mission_paragraph_2: string;
  mission_paragraph_3: string;
}

interface StoreForm {
  store_name: string;
  store_address: string;
  store_phone: string;
  store_email: string;
  store_working_days: string;
  store_opening_time: string;
  store_closing_time: string;
  store_image_url: string;
  store_maps_link: string;
}

interface CtaForm {
  cta_heading: string;
  cta_description: string;
  cta_button_text: string;
  cta_button_link: string;
  cta_background_image_url: string;
  cta_enabled: boolean;
}

type Message = { type: 'success' | 'error'; text: string } | null;

const HEADING_LIMIT = 80;
const DESCRIPTION_LIMIT = 300;
const BUTTON_TEXT_LIMIT = 30;
const PARAGRAPH_LIMIT = 500;

const EMPTY_HERO: HeroForm = {
  hero_heading: '',
  hero_description: '',
  hero_button_text: '',
  hero_button_link: '',
  hero_button_enabled: true,
  hero_image_url: '',
};

const EMPTY_MISSION: MissionForm = {
  mission_title: '',
  mission_image_url: '',
  mission_paragraph_1: '',
  mission_paragraph_2: '',
  mission_paragraph_3: '',
};

const EMPTY_STORE: StoreForm = {
  store_name: '',
  store_address: '',
  store_phone: '',
  store_email: '',
  store_working_days: '',
  store_opening_time: '',
  store_closing_time: '',
  store_image_url: '',
  store_maps_link: '',
};

const EMPTY_CTA: CtaForm = {
  cta_heading: '',
  cta_description: '',
  cta_button_text: '',
  cta_button_link: '',
  cta_background_image_url: '',
  cta_enabled: true,
};
function MessageBanner({ message }: { message: Message }) {
  if (!message) return null;
  return (
    <div
      className={`rounded-lg border text-sm px-4 py-3 ${
        message.type === 'success'
          ? 'bg-green-50 border-green-200 text-green-700'
          : 'bg-red-50 border-red-200 text-red-700'
      }`}
    >
      {message.text}
    </div>
  );
}
async function uploadAboutImage(file: File, prefix: string): Promise<{ url?: string; error?: string }> {
  const ext = file.name.split('.').pop();
  const path = `${prefix}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('about-images').upload(path, file, { upsert: true });
  if (error) return { error: error.message };
  const { data } = supabase.storage.from('about-images').getPublicUrl(path);
  return { url: data.publicUrl };
}
function ConfirmDialog({
  open,
  title,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full">
        <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-5">This cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-danger">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function AboutPageEditor() {
  const [heroForm, setHeroForm] = useState<HeroForm>(EMPTY_HERO);
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState('');
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroMessage, setHeroMessage] = useState<Message>(null);
  const [heroErrors, setHeroErrors] = useState<Partial<Record<keyof HeroForm, string>>>({});
  const [stats, setStats] = useState<StatRow[]>([]);
  const [statsSaving, setStatsSaving] = useState(false);
  const [statsMessage, setStatsMessage] = useState<Message>(null);
  const [deleteStatId, setDeleteStatId] = useState<string | null>(null);
  const [missionForm, setMissionForm] = useState<MissionForm>(EMPTY_MISSION);
  const [missionImageFile, setMissionImageFile] = useState<File | null>(null);
  const [missionPreview, setMissionPreview] = useState('');
  const [missionSaving, setMissionSaving] = useState(false);
  const [missionMessage, setMissionMessage] = useState<Message>(null);
  const [values, setValues] = useState<ValueRow[]>([]);
  const [valuesSaving, setValuesSaving] = useState(false);
  const [valuesMessage, setValuesMessage] = useState<Message>(null);
  const [deleteValueId, setDeleteValueId] = useState<string | null>(null);

  const [storeForm, setStoreForm] = useState<StoreForm>(EMPTY_STORE);
  const [storeImageFile, setStoreImageFile] = useState<File | null>(null);
  const [storePreview, setStorePreview] = useState('');
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeMessage, setStoreMessage] = useState<Message>(null);

  const [ctaForm, setCtaForm] = useState<CtaForm>(EMPTY_CTA);
  const [ctaImageFile, setCtaImageFile] = useState<File | null>(null);
  const [ctaPreview, setCtaPreview] = useState('');
  const [ctaSaving, setCtaSaving] = useState(false);
  const [ctaMessage, setCtaMessage] = useState<Message>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [pageRes, statsRes, valuesRes] = await Promise.all([
        supabase.from('about_page').select('*').eq('id', 1).maybeSingle(),
        supabase.from('about_statistics').select('*').order('display_order'),
        supabase.from('about_values').select('*').order('display_order'),
      ]);

      const page = pageRes.data;
      if (page) {
        setHeroForm({
          hero_heading: page.hero_heading ?? '',
          hero_description: page.hero_description ?? '',
          hero_button_text: page.hero_button_text ?? '',
          hero_button_link: page.hero_button_link ?? '',
          hero_button_enabled: page.hero_button_enabled ?? true,
          hero_image_url: page.hero_image_url ?? '',
        });
        setHeroPreview(page.hero_image_url ?? '');

        setMissionForm({
          mission_title: page.mission_title ?? '',
          mission_image_url: page.mission_image_url ?? '',
          mission_paragraph_1: page.mission_paragraph_1 ?? '',
          mission_paragraph_2: page.mission_paragraph_2 ?? '',
          mission_paragraph_3: page.mission_paragraph_3 ?? '',
        });
        setMissionPreview(page.mission_image_url ?? '');

        setStoreForm({
          store_name: page.store_name ?? '',
          store_address: page.store_address ?? '',
          store_phone: page.store_phone ?? '',
          store_email: page.store_email ?? '',
          store_working_days: page.store_working_days ?? '',
          store_opening_time: page.store_opening_time ?? '',
          store_closing_time: page.store_closing_time ?? '',
          store_image_url: page.store_image_url ?? '',
          store_maps_link: page.store_maps_link ?? '',
        });
        setStorePreview(page.store_image_url ?? '');

        setCtaForm({
          cta_heading: page.cta_heading ?? '',
          cta_description: page.cta_description ?? '',
          cta_button_text: page.cta_button_text ?? '',
          cta_button_link: page.cta_button_link ?? '',
          cta_background_image_url: page.cta_background_image_url ?? '',
          cta_enabled: page.cta_enabled ?? true,
        });
        setCtaPreview(page.cta_background_image_url ?? '');
      }

      if (statsRes.data) setStats(statsRes.data as StatRow[]);
      if (valuesRes.data) setValues(valuesRes.data as ValueRow[]);

      setLoading(false);
    }
    load();
  }, []);
  function handleHeroChange<K extends keyof HeroForm>(field: K, value: HeroForm[K]) {
    setHeroForm((f) => ({ ...f, [field]: value }));
    setHeroErrors((e) => ({ ...e, [field]: undefined }));
  }

  function handleHeroFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroImageFile(file);
    setHeroPreview(URL.createObjectURL(file));
  }

  function validateHero(): boolean {
    const next: Partial<Record<keyof HeroForm, string>> = {};
    if (!heroForm.hero_heading.trim()) next.hero_heading = 'Main heading is required.';
    if (!heroForm.hero_description.trim()) next.hero_description = 'Description is required.';
    if (heroForm.hero_button_enabled) {
      if (!heroForm.hero_button_text.trim()) next.hero_button_text = 'Button text is required when the button is enabled.';
      if (!heroForm.hero_button_link.trim()) next.hero_button_link = 'Button link is required when the button is enabled.';
    }
    setHeroErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleHeroSubmit(e: FormEvent) {
    e.preventDefault();
    setHeroMessage(null);
    if (!validateHero()) return;
    setHeroSaving(true);

    let imageUrl = heroForm.hero_image_url;
    if (heroImageFile) {
      const ext = heroImageFile.name.split('.').pop();
      const path = `about-hero-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('hero-images').upload(path, heroImageFile, { upsert: true });
      if (uploadError) {
        setHeroSaving(false);
        setHeroMessage({ type: 'error', text: `Image upload failed: ${uploadError.message}` });
        return;
      }
      const { data: urlData } = supabase.storage.from('hero-images').getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from('about_page').upsert({
      id: 1,
      hero_heading: heroForm.hero_heading,
      hero_description: heroForm.hero_description,
      hero_button_text: heroForm.hero_button_text,
      hero_button_link: heroForm.hero_button_link,
      hero_button_enabled: heroForm.hero_button_enabled,
      hero_image_url: imageUrl,
      updated_at: new Date().toISOString(),
    });

    setHeroSaving(false);
    if (error) {
      setHeroMessage({ type: 'error', text: `Save failed: ${error.message}` });
      return;
    }
    setHeroForm((f) => ({ ...f, hero_image_url: imageUrl }));
    setHeroImageFile(null);
    setHeroMessage({ type: 'success', text: 'Hero section updated.' });
  }

  function addStatRow() {
    setStats((rows) => [
      ...rows,
      {
        id: `new-${crypto.randomUUID()}`,
        icon: '',
        value: '',
        title: '',
        description: '',
        display_order: rows.length,
        is_active: true,
      },
    ]);
  }

  function updateStatRow<K extends keyof StatRow>(id: string, field: K, value: StatRow[K]) {
    setStats((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  async function confirmDeleteStat() {
    const id = deleteStatId;
    setDeleteStatId(null);
    if (!id) return;
    if (!id.startsWith('new-')) {
      const { error } = await supabase.from('about_statistics').delete().eq('id', id);
      if (error) {
        setStatsMessage({ type: 'error', text: `Delete failed: ${error.message}` });
        return;
      }
    }
    setStats((rows) => rows.filter((r) => r.id !== id));
    setStatsMessage({ type: 'success', text: 'Statistic deleted.' });
  }

  async function handleStatsSubmit(e: FormEvent) {
    e.preventDefault();
    setStatsMessage(null);

    for (const row of stats) {
      if (!row.title.trim() || !row.value.trim()) {
        setStatsMessage({ type: 'error', text: 'Each statistic needs a number and a title.' });
        return;
      }
    }

    setStatsSaving(true);

    const toInsert = stats
      .filter((r) => r.id.startsWith('new-'))
      .map(({ id, ...rest }) => rest);
    const toUpdate = stats.filter((r) => !r.id.startsWith('new-'));

    if (toInsert.length > 0) {
      const { error } = await supabase.from('about_statistics').insert(toInsert);
      if (error) {
        setStatsSaving(false);
        setStatsMessage({ type: 'error', text: `Save failed: ${error.message}` });
        return;
      }
    }

    if (toUpdate.length > 0) {
      const { error } = await supabase.from('about_statistics').upsert(toUpdate);
      if (error) {
        setStatsSaving(false);
        setStatsMessage({ type: 'error', text: `Save failed: ${error.message}` });
        return;
      }
    }

    const { data: refreshed } = await supabase.from('about_statistics').select('*').order('display_order');
    if (refreshed) setStats(refreshed as StatRow[]);

    setStatsSaving(false);
    setStatsMessage({ type: 'success', text: 'Statistics updated.' });
  }
  function handleMissionChange<K extends keyof MissionForm>(field: K, value: MissionForm[K]) {
    setMissionForm((f) => ({ ...f, [field]: value }));
  }

  function handleMissionFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMissionImageFile(file);
    setMissionPreview(URL.createObjectURL(file));
  }

  async function handleMissionSubmit(e: FormEvent) {
    e.preventDefault();
    setMissionMessage(null);

    if (!missionForm.mission_title.trim()) {
      setMissionMessage({ type: 'error', text: 'Section title is required.' });
      return;
    }

    setMissionSaving(true);

    let imageUrl = missionForm.mission_image_url;
    if (missionImageFile) {
      const { url, error } = await uploadAboutImage(missionImageFile, 'mission');
      if (error) {
        setMissionSaving(false);
        setMissionMessage({ type: 'error', text: `Image upload failed: ${error}` });
        return;
      }
      imageUrl = url!;
    }

    const { error } = await supabase.from('about_page').upsert({
      id: 1,
      mission_title: missionForm.mission_title,
      mission_image_url: imageUrl,
      mission_paragraph_1: missionForm.mission_paragraph_1,
      mission_paragraph_2: missionForm.mission_paragraph_2,
      mission_paragraph_3: missionForm.mission_paragraph_3,
      updated_at: new Date().toISOString(),
    });

    setMissionSaving(false);
    if (error) {
      setMissionMessage({ type: 'error', text: `Save failed: ${error.message}` });
      return;
    }
    setMissionForm((f) => ({ ...f, mission_image_url: imageUrl }));
    setMissionImageFile(null);
    setMissionMessage({ type: 'success', text: 'Mission section updated.' });
  }

  function addValueRow() {
    setValues((rows) => [
      ...rows,
      {
        id: `new-${crypto.randomUUID()}`,
        icon: '',
        title: '',
        description: '',
        display_order: rows.length,
        is_active: true,
      },
    ]);
  }

  function updateValueRow<K extends keyof ValueRow>(id: string, field: K, value: ValueRow[K]) {
    setValues((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  async function confirmDeleteValue() {
    const id = deleteValueId;
    setDeleteValueId(null);
    if (!id) return;
    if (!id.startsWith('new-')) {
      const { error } = await supabase.from('about_values').delete().eq('id', id);
      if (error) {
        setValuesMessage({ type: 'error', text: `Delete failed: ${error.message}` });
        return;
      }
    }
    setValues((rows) => rows.filter((r) => r.id !== id));
    setValuesMessage({ type: 'success', text: 'Value deleted.' });
  }

  async function handleValuesSubmit(e: FormEvent) {
    e.preventDefault();
    setValuesMessage(null);

    for (const row of values) {
      if (!row.title.trim()) {
        setValuesMessage({ type: 'error', text: 'Each value needs a title.' });
        return;
      }
    }

    setValuesSaving(true);

    const toInsert = values
      .filter((r) => r.id.startsWith('new-'))
      .map(({ id, ...rest }) => rest);
    const toUpdate = values.filter((r) => !r.id.startsWith('new-'));

    if (toInsert.length > 0) {
      const { error } = await supabase.from('about_values').insert(toInsert);
      if (error) {
        setValuesSaving(false);
        setValuesMessage({ type: 'error', text: `Save failed: ${error.message}` });
        return;
      }
    }

    if (toUpdate.length > 0) {
      const { error } = await supabase.from('about_values').upsert(toUpdate);
      if (error) {
        setValuesSaving(false);
        setValuesMessage({ type: 'error', text: `Save failed: ${error.message}` });
        return;
      }
    }

    const { data: refreshed } = await supabase.from('about_values').select('*').order('display_order');
    if (refreshed) setValues(refreshed as ValueRow[]);

    setValuesSaving(false);
    setValuesMessage({ type: 'success', text: 'Values updated.' });
  }
  function handleStoreChange<K extends keyof StoreForm>(field: K, value: StoreForm[K]) {
    setStoreForm((f) => ({ ...f, [field]: value }));
  }

  function handleStoreFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStoreImageFile(file);
    setStorePreview(URL.createObjectURL(file));
  }

  async function handleStoreSubmit(e: FormEvent) {
    e.preventDefault();
    setStoreMessage(null);

    if (!storeForm.store_name.trim()) {
      setStoreMessage({ type: 'error', text: 'Store name is required.' });
      return;
    }

    setStoreSaving(true);

    let imageUrl = storeForm.store_image_url;
    if (storeImageFile) {
      const { url, error } = await uploadAboutImage(storeImageFile, 'store');
      if (error) {
        setStoreSaving(false);
        setStoreMessage({ type: 'error', text: `Image upload failed: ${error}` });
        return;
      }
      imageUrl = url!;
    }

    const { error } = await supabase.from('about_page').upsert({
      id: 1,
      store_name: storeForm.store_name,
      store_address: storeForm.store_address,
      store_phone: storeForm.store_phone,
      store_email: storeForm.store_email,
      store_working_days: storeForm.store_working_days,
      store_opening_time: storeForm.store_opening_time,
      store_closing_time: storeForm.store_closing_time,
      store_image_url: imageUrl,
      store_maps_link: storeForm.store_maps_link,
      updated_at: new Date().toISOString(),
    });

    setStoreSaving(false);
    if (error) {
      setStoreMessage({ type: 'error', text: `Save failed: ${error.message}` });
      return;
    }
    setStoreForm((f) => ({ ...f, store_image_url: imageUrl }));
    setStoreImageFile(null);
    setStoreMessage({ type: 'success', text: 'Store information updated.' });
  }
  function handleCtaChange<K extends keyof CtaForm>(field: K, value: CtaForm[K]) {
    setCtaForm((f) => ({ ...f, [field]: value }));
  }

  function handleCtaFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCtaImageFile(file);
    setCtaPreview(URL.createObjectURL(file));
  }

  async function handleCtaSubmit(e: FormEvent) {
    e.preventDefault();
    setCtaMessage(null);

    if (ctaForm.cta_enabled) {
      if (!ctaForm.cta_heading.trim() || !ctaForm.cta_button_text.trim() || !ctaForm.cta_button_link.trim()) {
        setCtaMessage({ type: 'error', text: 'Heading, button text, and button link are required when the CTA is enabled.' });
        return;
      }
    }

    setCtaSaving(true);

    let imageUrl = ctaForm.cta_background_image_url;
    if (ctaImageFile) {
      const { url, error } = await uploadAboutImage(ctaImageFile, 'cta');
      if (error) {
        setCtaSaving(false);
        setCtaMessage({ type: 'error', text: `Image upload failed: ${error}` });
        return;
      }
      imageUrl = url!;
    }

    const { error } = await supabase.from('about_page').upsert({
      id: 1,
      cta_heading: ctaForm.cta_heading,
      cta_description: ctaForm.cta_description,
      cta_button_text: ctaForm.cta_button_text,
      cta_button_link: ctaForm.cta_button_link,
      cta_background_image_url: imageUrl,
      cta_enabled: ctaForm.cta_enabled,
      updated_at: new Date().toISOString(),
    });

    setCtaSaving(false);
    if (error) {
      setCtaMessage({ type: 'error', text: `Save failed: ${error.message}` });
      return;
    }
    setCtaForm((f) => ({ ...f, cta_background_image_url: imageUrl }));
    setCtaImageFile(null);
    setCtaMessage({ type: 'success', text: 'Bottom CTA updated.' });
  }
  if (loading) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">About Page</h1>
        <div className="bg-white rounded-xl border p-6 h-64 skeleton" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">About Page</h1>
        <p className="text-gray-500">Edit each section below. Sections save independently.</p>
      </div>

      <form onSubmit={handleHeroSubmit} className="bg-white rounded-xl border p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">Hero Section</h2>
        <MessageBanner message={heroMessage} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hero background image</label>
          {heroPreview && (
            <img src={heroPreview} alt="Hero preview" className="w-full max-h-56 object-cover rounded-lg mb-3" />
          )}
          <input type="file" accept="image/*" onChange={handleHeroFileSelect} />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Main heading</label>
            <span className="text-xs text-gray-400">{heroForm.hero_heading.length}/{HEADING_LIMIT}</span>
          </div>
          <input
            type="text"
            value={heroForm.hero_heading}
            maxLength={HEADING_LIMIT}
            onChange={(e) => handleHeroChange('hero_heading', e.target.value)}
            className={`input ${heroErrors.hero_heading ? 'border-red-400 focus:ring-red-400' : ''}`}
          />
          {heroErrors.hero_heading && <p className="text-xs text-red-600 mt-1">{heroErrors.hero_heading}</p>}
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <span className="text-xs text-gray-400">{heroForm.hero_description.length}/{DESCRIPTION_LIMIT}</span>
          </div>
          <textarea
            value={heroForm.hero_description}
            maxLength={DESCRIPTION_LIMIT}
            onChange={(e) => handleHeroChange('hero_description', e.target.value)}
            rows={3}
            className={`input ${heroErrors.hero_description ? 'border-red-400 focus:ring-red-400' : ''}`}
          />
          {heroErrors.hero_description && <p className="text-xs text-red-600 mt-1">{heroErrors.hero_description}</p>}
        </div>

        <div className="flex items-center gap-2">
          <input
            id="hero_button_enabled"
            type="checkbox"
            checked={heroForm.hero_button_enabled}
            onChange={(e) => handleHeroChange('hero_button_enabled', e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="hero_button_enabled" className="text-sm font-medium text-gray-700">
            Show button on the About page
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Button text</label>
              <span className="text-xs text-gray-400">{heroForm.hero_button_text.length}/{BUTTON_TEXT_LIMIT}</span>
            </div>
            <input
              type="text"
              value={heroForm.hero_button_text}
              maxLength={BUTTON_TEXT_LIMIT}
              onChange={(e) => handleHeroChange('hero_button_text', e.target.value)}
              disabled={!heroForm.hero_button_enabled}
              className={`input disabled:opacity-50 ${heroErrors.hero_button_text ? 'border-red-400 focus:ring-red-400' : ''}`}
            />
            {heroErrors.hero_button_text && <p className="text-xs text-red-600 mt-1">{heroErrors.hero_button_text}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Button link</label>
            <input
              type="text"
              value={heroForm.hero_button_link}
              onChange={(e) => handleHeroChange('hero_button_link', e.target.value)}
              disabled={!heroForm.hero_button_enabled}
              placeholder="/about or https://..."
              className={`input disabled:opacity-50 ${heroErrors.hero_button_link ? 'border-red-400 focus:ring-red-400' : ''}`}
            />
            {heroErrors.hero_button_link && <p className="text-xs text-red-600 mt-1">{heroErrors.hero_button_link}</p>}
          </div>
        </div>

        <button type="submit" disabled={heroSaving} className="flex items-center gap-2 rounded-lg bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-blue-700 disabled:opacity-60">
          {heroSaving && <Loader2 size={16} className="animate-spin" />}
          {heroSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
      <form onSubmit={handleStatsSubmit} className="bg-white rounded-xl border p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Statistics</h2>
          <button type="button" onClick={addStatRow} className="btn-secondary text-sm flex items-center gap-1">
            <Plus size={16} /> Add Statistic
          </button>
        </div>
        <MessageBanner message={statsMessage} />

        <div className="space-y-4">
          {stats.length === 0 && <p className="text-sm text-gray-400">No statistics yet. Add one above.</p>}
          {stats.map((row) => (
            <div key={row.id} className="border rounded-lg p-4 grid grid-cols-2 gap-3 relative">
              <button
                type="button"
                onClick={() => setDeleteStatId(row.id)}
                className="absolute top-3 right-3 text-gray-400 hover:text-red-600"
                aria-label="Delete statistic"
              >
                <Trash2 size={16} />
              </button>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Icon</label>
                <input
                  type="text"
                  value={row.icon}
                  onChange={(e) => updateStatRow(row.id, 'icon', e.target.value)}
                  placeholder="e.g. Users"
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Number</label>
                <input
                  type="text"
                  value={row.value}
                  onChange={(e) => updateStatRow(row.id, 'value', e.target.value)}
                  placeholder="10,000+"
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                <input
                  type="text"
                  value={row.title}
                  onChange={(e) => updateStatRow(row.id, 'title', e.target.value)}
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Display order</label>
                <input
                  type="number"
                  value={row.display_order}
                  onChange={(e) => updateStatRow(row.id, 'display_order', Number(e.target.value))}
                  className="input text-sm"
                />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={row.is_active}
                  onChange={(e) => updateStatRow(row.id, 'is_active', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label className="text-sm text-gray-700">Active</label>
              </div>
            </div>
          ))}
        </div>

        <button type="submit" disabled={statsSaving} className="flex items-center gap-2 rounded-lg bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-blue-700 disabled:opacity-60">
          {statsSaving && <Loader2 size={16} className="animate-spin" />}
          {statsSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
      <form onSubmit={handleMissionSubmit} className="bg-white rounded-xl border p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">Mission Section</h2>
        <MessageBanner message={missionMessage} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Left image</label>
          {missionPreview && (
            <img src={missionPreview} alt="Mission preview" className="w-full max-h-56 object-cover rounded-lg mb-3" />
          )}
          <input type="file" accept="image/*" onChange={handleMissionFileSelect} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Section title</label>
          <input
            type="text"
            value={missionForm.mission_title}
            maxLength={HEADING_LIMIT}
            onChange={(e) => handleMissionChange('mission_title', e.target.value)}
            className="input"
          />
        </div>

        {(['mission_paragraph_1', 'mission_paragraph_2', 'mission_paragraph_3'] as const).map((field, i) => (
          <div key={field}>
            <div className="flex justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Paragraph {i + 1}</label>
              <span className="text-xs text-gray-400">{missionForm[field].length}/{PARAGRAPH_LIMIT}</span>
            </div>
            <textarea
              value={missionForm[field]}
              maxLength={PARAGRAPH_LIMIT}
              onChange={(e) => handleMissionChange(field, e.target.value)}
              rows={3}
              className="input"
            />
          </div>
        ))}

        <button type="submit" disabled={missionSaving} className="flex items-center gap-2 rounded-lg bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-blue-700 disabled:opacity-60">
          {missionSaving && <Loader2 size={16} className="animate-spin" />}
          {missionSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      <form onSubmit={handleValuesSubmit} className="bg-white rounded-xl border p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Our Values</h2>
          <button type="button" onClick={addValueRow} className="btn-secondary text-sm flex items-center gap-1">
            <Plus size={16} /> Add Value
          </button>
        </div>
        <MessageBanner message={valuesMessage} />

        <div className="space-y-4">
          {values.length === 0 && <p className="text-sm text-gray-400">No values yet. Add one above.</p>}
          {values.map((row) => (
            <div key={row.id} className="border rounded-lg p-4 space-y-3 relative">
              <button
                type="button"
                onClick={() => setDeleteValueId(row.id)}
                className="absolute top-3 right-3 text-gray-400 hover:text-red-600"
                aria-label="Delete value"
              >
                <Trash2 size={16} />
              </button>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                  <input
                    type="text"
                    value={row.title}
                    onChange={(e) => updateValueRow(row.id, 'title', e.target.value)}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Display order</label>
                  <input
                    type="number"
                    value={row.display_order}
                    onChange={(e) => updateValueRow(row.id, 'display_order', Number(e.target.value))}
                    className="input text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  value={row.description}
                  onChange={(e) => updateValueRow(row.id, 'description', e.target.value)}
                  rows={2}
                  className="input text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={row.is_active}
                  onChange={(e) => updateValueRow(row.id, 'is_active', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label className="text-sm text-gray-700">Active</label>
              </div>
            </div>
          ))}
        </div>

        <button type="submit" disabled={valuesSaving} className="flex items-center gap-2 rounded-lg bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-blue-700 disabled:opacity-60">
          {valuesSaving && <Loader2 size={16} className="animate-spin" />}
          {valuesSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
      <form onSubmit={handleStoreSubmit} className="bg-white rounded-xl border p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">Store Information</h2>
        <MessageBanner message={storeMessage} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Store image</label>
          {storePreview && (
            <img src={storePreview} alt="Store preview" className="w-full max-h-56 object-cover rounded-lg mb-3" />
          )}
          <input type="file" accept="image/*" onChange={handleStoreFileSelect} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store name</label>
            <input type="text" value={storeForm.store_name} onChange={(e) => handleStoreChange('store_name', e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="text" value={storeForm.store_phone} onChange={(e) => handleStoreChange('store_phone', e.target.value)} className="input" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea value={storeForm.store_address} onChange={(e) => handleStoreChange('store_address', e.target.value)} rows={2} className="input" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={storeForm.store_email} onChange={(e) => handleStoreChange('store_email', e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Working days</label>
            <input type="text" value={storeForm.store_working_days} onChange={(e) => handleStoreChange('store_working_days', e.target.value)} placeholder="Mon - Sat" className="input" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opening time</label>
            <input type="text" value={storeForm.store_opening_time} onChange={(e) => handleStoreChange('store_opening_time', e.target.value)} placeholder="9:00 AM" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Closing time</label>
            <input type="text" value={storeForm.store_closing_time} onChange={(e) => handleStoreChange('store_closing_time', e.target.value)} placeholder="8:00 PM" className="input" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps URL</label>
          <input type="text" value={storeForm.store_maps_link} onChange={(e) => handleStoreChange('store_maps_link', e.target.value)} className="input" />
        </div>

        <button type="submit" disabled={storeSaving} className="flex items-center gap-2 rounded-lg bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-blue-700 disabled:opacity-60">
          {storeSaving && <Loader2 size={16} className="animate-spin" />}
          {storeSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
      <form onSubmit={handleCtaSubmit} className="bg-white rounded-xl border p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">Bottom Call To Action</h2>
        <MessageBanner message={ctaMessage} />

        <div className="flex items-center gap-2">
          <input
            id="cta_enabled"
            type="checkbox"
            checked={ctaForm.cta_enabled}
            onChange={(e) => handleCtaChange('cta_enabled', e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="cta_enabled" className="text-sm font-medium text-gray-700">
            Show this section on the About page
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Background image</label>
          {ctaPreview && (
            <img src={ctaPreview} alt="CTA preview" className="w-full max-h-56 object-cover rounded-lg mb-3" />
          )}
          <input type="file" accept="image/*" onChange={handleCtaFileSelect} disabled={!ctaForm.cta_enabled} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
          <input
            type="text"
            value={ctaForm.cta_heading}
            maxLength={HEADING_LIMIT}
            onChange={(e) => handleCtaChange('cta_heading', e.target.value)}
            disabled={!ctaForm.cta_enabled}
            className="input disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={ctaForm.cta_description}
            maxLength={DESCRIPTION_LIMIT}
            onChange={(e) => handleCtaChange('cta_description', e.target.value)}
            rows={2}
            disabled={!ctaForm.cta_enabled}
            className="input disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Button text</label>
            <input
              type="text"
              value={ctaForm.cta_button_text}
              maxLength={BUTTON_TEXT_LIMIT}
              onChange={(e) => handleCtaChange('cta_button_text', e.target.value)}
              disabled={!ctaForm.cta_enabled}
              className="input disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Button link</label>
            <input
              type="text"
              value={ctaForm.cta_button_link}
              onChange={(e) => handleCtaChange('cta_button_link', e.target.value)}
              disabled={!ctaForm.cta_enabled}
              className="input disabled:opacity-50"
            />
          </div>
        </div>

        <button type="submit" disabled={ctaSaving} className="flex items-center gap-2 rounded-lg bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-blue-700 disabled:opacity-60">
          {ctaSaving && <Loader2 size={16} className="animate-spin" />}
          {ctaSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      <ConfirmDialog
        open={deleteStatId !== null}
        title="Delete this statistic?"
        onConfirm={confirmDeleteStat}
        onCancel={() => setDeleteStatId(null)}
      />
      <ConfirmDialog
        open={deleteValueId !== null}
        title="Delete this value?"
        onConfirm={confirmDeleteValue}
        onCancel={() => setDeleteValueId(null)}
      />
    </div>
  );
}