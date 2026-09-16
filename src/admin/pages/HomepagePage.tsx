import { useEffect, useState, ChangeEvent } from 'react';
import { ChevronDown, ChevronUp, ArrowUp, ArrowDown, Loader2, X, Check } from 'lucide-react';
import { supabaseAdmin as supabase } from '../../lib/supabaseAdmin';
import {
  getHomepageSections, updateHomepageSection, reorderSections,
  getHomepageFeatures, upsertHomepageFeature, deleteHomepageFeature,
  getHomepageCategoryPicks, setHomepageCategoryPicks, removeHomepageCategoryPick,
  getHomepageProductPicks, setHomepageProductPicks, removeHomepageProductPick,
  uploadHomepageImage,
  type HomepageSection, type HomepageFeature, type HomepageCategoryPick, type HomepageProductPick,
} from '../../lib/homepage';

const ICON_OPTIONS = ['Truck', 'Shield', 'RefreshCw', 'HeadphonesIcon', 'Package', 'Star', 'CreditCard', 'Clock', 'Award', 'ThumbsUp'];
const THEME_OPTIONS = [
  { value: 'white', label: 'White' },
  { value: 'light_gray', label: 'Light Gray' },
  { value: 'dark', label: 'Dark' },
  { value: 'primary', label: 'Primary' },
];
const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero', features: 'Features', categories: 'Shop by Category',
  featured_products: 'Featured Products', best_sellers: 'Best Sellers',
  newsletter: 'Newsletter', contact_cta: 'Contact / Help CTA',
};

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${on ? 'bg-green-500' : 'bg-gray-300'}`}
    >
      <span className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

function Msg({ msg }: { msg: { type: 'success' | 'error'; text: string } | null }) {
  if (!msg) return null;
  return (
    <div className={`mb-4 rounded-lg text-sm px-4 py-2 flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
      {msg.type === 'success' ? <Check size={16} /> : <X size={16} />}
      {msg.text}
    </div>
  );
}

interface ShellProps {
  sectionKey: string;
  section: HomepageSection | undefined;
  isFirst: boolean;
  isLast: boolean;
  onToggleEnabled: (v: boolean) => void;
  onMove: (dir: 'up' | 'down') => void;
  children: React.ReactNode;
}

function SectionShell({ sectionKey, section, isFirst, isLast, onToggleEnabled, onMove, children }: ShellProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 font-semibold text-gray-900 min-w-0">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          <span className="truncate">{SECTION_LABELS[sectionKey]}</span>
        </button>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button type="button" disabled={isFirst} onClick={() => onMove('up')} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30">
            <ArrowUp size={16} />
          </button>
          <button type="button" disabled={isLast} onClick={() => onMove('down')} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30">
            <ArrowDown size={16} />
          </button>
          <Toggle on={section?.is_enabled ?? true} onChange={onToggleEnabled} />
        </div>
      </div>
      {open && <div className="px-4 sm:px-6 pb-6 border-t">{children}</div>}
    </div>
  );
}

export function HomepagePage() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [features, setFeatures] = useState<HomepageFeature[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [catPicks, setCatPicks] = useState<HomepageCategoryPick[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [featuredPicks, setFeaturedPicks] = useState<HomepageProductPick[]>([]);
  const [bestsellerPicks, setBestsellerPicks] = useState<HomepageProductPick[]>([]);
  const [hero, setHero] = useState<any>({});
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState('');
  const [bsFile, setBsFile] = useState<File | null>(null);
  const [bsPreview, setBsPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<Record<string, { type: 'success' | 'error'; text: string } | null>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  async function loadAll() {
    setLoading(true);
    const [sectionRows, featureRows, { data: cats }, picks, { data: prods }, fp, bp, { data: heroData }] = await Promise.all([
      getHomepageSections(supabase), getHomepageFeatures(supabase),
      supabase.from('categories').select('*').order('name'),
      getHomepageCategoryPicks(supabase),
      supabase.from('products').select('id,name').order('name'),
      getHomepageProductPicks('featured_products', supabase),
      getHomepageProductPicks('best_sellers', supabase),
      supabase.from('homepage_hero').select('*').eq('id', 1).maybeSingle(),
    ]);
    setSections(sectionRows);
    setFeatures(featureRows);
    setCategories(cats || []);
    setCatPicks(picks);
    setProducts(prods || []);
    setFeaturedPicks(fp);
    setBestsellerPicks(bp);
    setHero(heroData || {});
    setHeroPreview(heroData?.image_url || '');
    setBsPreview(sectionRows.find((s) => s.section_key === 'best_sellers')?.content?.image_url || '');
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  function section(key: string) { return sections.find((s) => s.section_key === key); }

  function setSaveMsg(key: string, m: { type: 'success' | 'error'; text: string } | null) {
    setMsg((s) => ({ ...s, [key]: m }));
    if (m) setTimeout(() => setMsg((s) => ({ ...s, [key]: null })), 3000);
  }

  async function toggleEnabled(key: string, v: boolean) {
    setSections((prev) => prev.map((s) => (s.section_key === key ? { ...s, is_enabled: v } : s)));
    try { await updateHomepageSection(key, { is_enabled: v }, supabase); } catch (e: any) { setSaveMsg(key, { type: 'error', text: e.message }); }
  }

  async function moveSection(key: string, dir: 'up' | 'down') {
    const ordered = [...sections].sort((a, b) => a.display_order - b.display_order);
    const idx = ordered.findIndex((s) => s.section_key === key);
    const swapWith = dir === 'up' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= ordered.length) return;
    const reordered = [...ordered];
    [reordered[idx], reordered[swapWith]] = [reordered[swapWith], reordered[idx]];
    const newOrder = reordered.map((s, index) => ({
      section_key: s.section_key,
      display_order: index + 1,
    }));
    setSections((prev) => prev.map((s) => {
      const found = newOrder.find((o) => o.section_key === s.section_key);
      return found ? { ...s, display_order: found.display_order } : s;
    }));
    try { await reorderSections(newOrder, supabase); } catch (e: any) { setSaveMsg(key, { type: 'error', text: e.message }); }
  }

  function handleHeroFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setHeroFile(f);
    setHeroPreview(URL.createObjectURL(f));
  }
  async function saveHero() {
    setSaving((s) => ({ ...s, hero: true }));
    try {
      let image_url = hero.image_url || '';
      if (heroFile) image_url = await uploadHomepageImage(heroFile, 'hero', supabase);
      const payload = { id: 1, ...hero, image_url, updated_at: new Date().toISOString() };
      const { error } = await supabase.from('homepage_hero').upsert(payload);
      if (error) throw error;
      setHero((h: any) => ({ ...h, image_url }));
      setHeroFile(null);
      setSaveMsg('hero', { type: 'success', text: 'Hero section saved.' });
    } catch (e: any) {
      setSaveMsg('hero', { type: 'error', text: e.message });
    } finally {
      setSaving((s) => ({ ...s, hero: false }));
    }
  }

  function updateFeatureLocal(id: string, patch: Partial<HomepageFeature>) {
    setFeatures((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }
  function addFeature() {
    const tempId = `new-${Date.now()}`;
    setFeatures((prev) => [...prev, { id: tempId, title: '', description: '', icon: 'Truck', display_order: prev.length + 1, is_enabled: true }]);
  }
  async function saveFeatures() {
    setSaving((s) => ({ ...s, features: true }));
    try {
      for (const f of features) {
        const { id, ...rest } = f;
        if (id.startsWith('new-')) {
          await upsertHomepageFeature(rest, supabase);
        } else {
          await upsertHomepageFeature(f, supabase);
        }
      }
      await loadAll();
      setSaveMsg('features', { type: 'success', text: 'Features saved.' });
    } catch (e: any) {
      setSaveMsg('features', { type: 'error', text: e.message });
    } finally {
      setSaving((s) => ({ ...s, features: false }));
    }
  }
  async function removeFeature(id: string) {
    if (id.startsWith('new-')) { setFeatures((prev) => prev.filter((f) => f.id !== id)); return; }
    try { await deleteHomepageFeature(id, supabase); setFeatures((prev) => prev.filter((f) => f.id !== id)); } catch (e: any) { setSaveMsg('features', { type: 'error', text: e.message }); }
  }

  async function saveCategoriesSection(title: string, subtitle: string) {
    setSaving((s) => ({ ...s, categories: true }));
    try {
      await updateHomepageSection('categories', { title, subtitle }, supabase);
      const enabledPicks = catPicks.filter((p) => p.is_enabled);

const toSave = enabledPicks.map((p, index) => ({
  category_id: p.category_id,
  display_order: index + 1,
  is_enabled: true,
  image_override_url: p.image_override_url ?? null,
}));

if (toSave.length) {
  await setHomepageCategoryPicks(toSave, supabase);
}
      await loadAll();
      setSaveMsg('categories', { type: 'success', text: 'Categories section saved.' });
    } catch (e: any) {
      setSaveMsg('categories', { type: 'error', text: e.message });
    } finally {
      setSaving((s) => ({ ...s, categories: false }));
    }
  }
  function toggleCategoryPick(categoryId: string, on: boolean) {
    setCatPicks((prev) => {
      const existing = prev.find((p) => p.category_id === categoryId);
      if (existing) return prev.map((p) => (p.category_id === categoryId ? { ...p, is_enabled: on } : p));
      return [...prev, { id: `new-${categoryId}`, category_id: categoryId, display_order: prev.length + 1, is_enabled: on, image_override_url: null }];
    });
  }

  function toggleProductPick(sectionKey: 'featured_products' | 'best_sellers', productId: string, on: boolean) {
    const setter = sectionKey === 'featured_products' ? setFeaturedPicks : setBestsellerPicks;
    setter((prev) => {
      const existing = prev.find((p) => p.product_id === productId);
      if (existing) return prev.map((p) => (p.product_id === productId ? { ...p, is_enabled: on } : p));
      return [...prev, { id: `new-${productId}`, product_id: productId, section_key: sectionKey, display_order: prev.length + 1, is_enabled: on }];
    });
  }
  async function saveProductSection(sectionKey: 'featured_products' | 'best_sellers', patch: Record<string, any>) {
    setSaving((s) => ({ ...s, [sectionKey]: true }));
    try {
      const sec = section(sectionKey);
      await updateHomepageSection(sectionKey, { title: patch.title, subtitle: patch.subtitle, content: { ...sec?.content, ...patch.content } }, supabase);
      const picks = sectionKey === 'featured_products' ? featuredPicks : bestsellerPicks;
      const enabledPicks = picks.filter((p) => p.is_enabled);
      const toSave = enabledPicks.map((p, index) => ({
        product_id: p.product_id,
        section_key: p.section_key,
        display_order: index + 1,
        is_enabled: true,
      }));

      if (toSave.length) {
        await setHomepageProductPicks(toSave, supabase);
      }
      await loadAll();
      setSaveMsg(sectionKey, { type: 'success', text: 'Section saved.' });
    } catch (e: any) {
      setSaveMsg(sectionKey, { type: 'error', text: e.message });
    } finally {
      setSaving((s) => ({ ...s, [sectionKey]: false }));
    }
  }

  function handleBsFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBsFile(f);
    setBsPreview(URL.createObjectURL(f));
  }

  async function saveSimpleSection(key: string, patch: Record<string, any>) {
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      const sec = section(key);
      await updateHomepageSection(key, { ...patch, content: { ...sec?.content, ...patch.content } }, supabase);
      await loadAll();
      setSaveMsg(key, { type: 'success', text: 'Section saved.' });
    } catch (e: any) {
      setSaveMsg(key, { type: 'error', text: e.message });
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  const ordered = [...sections].sort((a, b) => a.display_order - b.display_order);
  const featuredSec = section('featured_products');
  const bestSec = section('best_sellers');
  const catSec = section('categories');
  const newsSec = section('newsletter');
  const contactSec = section('contact_cta');

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold mb-1">Homepage Manager</h1>
        <p className="text-gray-500">Control every section of the customer homepage.</p>
      </div>

      {ordered.map((s, idx) => {
        const shellProps = {
          sectionKey: s.section_key,
          section: s,
          isFirst: idx === 0,
          isLast: idx === ordered.length - 1,
          onToggleEnabled: (v: boolean) => toggleEnabled(s.section_key, v),
          onMove: (dir: 'up' | 'down') => moveSection(s.section_key, dir),
        };

        if (s.section_key === 'hero') {
          return (
            <SectionShell key="hero" {...shellProps}>
              <Msg msg={msg.hero} />
              <div className="space-y-4 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hero image</label>
                  {heroPreview && <img src={heroPreview} alt="Hero preview" className="w-full max-h-56 object-cover rounded-lg mb-2" />}
                  <div className="flex items-center gap-3">
                    <input type="file" accept="image/*" onChange={handleHeroFile} />
                    <label className="flex items-center gap-2 text-sm">
                      <Toggle on={hero.show_image ?? true} onChange={(v) => setHero((h: any) => ({ ...h, show_image: v }))} /> Show image
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Main heading</label>
                  <input className="w-full rounded-lg border px-3 py-2" value={hero.heading || ''} onChange={(e) => setHero((h: any) => ({ ...h, heading: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Highlighted text</label>
                  <input className="w-full rounded-lg border px-3 py-2" value={hero.highlighted_text || ''} onChange={(e) => setHero((h: any) => ({ ...h, highlighted_text: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows={3} className="w-full rounded-lg border px-3 py-2" value={hero.description || ''} onChange={(e) => setHero((h: any) => ({ ...h, description: e.target.value }))} />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    Price badge <Toggle on={hero.show_price_badge ?? true} onChange={(v) => setHero((h: any) => ({ ...h, show_price_badge: v }))} />
                  </label>
                  <input className="w-full rounded-lg border px-3 py-2" value={hero.price_badge || ''} onChange={(e) => setHero((h: any) => ({ ...h, price_badge: e.target.value }))} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      Primary button <Toggle on={hero.primary_button_enabled ?? true} onChange={(v) => setHero((h: any) => ({ ...h, primary_button_enabled: v }))} />
                    </label>
                    <input className="w-full rounded-lg border px-3 py-2 mb-2" placeholder="Text" value={hero.primary_button_text || ''} onChange={(e) => setHero((h: any) => ({ ...h, primary_button_text: e.target.value }))} />
                    <input className="w-full rounded-lg border px-3 py-2" placeholder="Link" value={hero.primary_button_link || ''} onChange={(e) => setHero((h: any) => ({ ...h, primary_button_link: e.target.value }))} />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      Secondary button <Toggle on={hero.secondary_button_enabled ?? true} onChange={(v) => setHero((h: any) => ({ ...h, secondary_button_enabled: v }))} />
                    </label>
                    <input className="w-full rounded-lg border px-3 py-2 mb-2" placeholder="Text" value={hero.secondary_button_text || ''} onChange={(e) => setHero((h: any) => ({ ...h, secondary_button_text: e.target.value }))} />
                    <input className="w-full rounded-lg border px-3 py-2" placeholder="Link" value={hero.secondary_button_link || ''} onChange={(e) => setHero((h: any) => ({ ...h, secondary_button_link: e.target.value }))} />
                  </div>
                </div>
                <button disabled={saving.hero} onClick={saveHero} className="flex items-center gap-2 rounded-lg bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-blue-700 disabled:opacity-60">
                  {saving.hero && <Loader2 size={16} className="animate-spin" />} {saving.hero ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </SectionShell>
          );
        }

        if (s.section_key === 'features') {
          return (
            <SectionShell key="features" {...shellProps}>
              <Msg msg={msg.features} />
              <div className="space-y-4 pt-4">
                {features.map((f) => (
                  <div key={f.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <select className="rounded-lg border px-2 py-2 text-sm" value={f.icon} onChange={(e) => updateFeatureLocal(f.id, { icon: e.target.value })}>
                        {ICON_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
                      </select>
                      <input className="flex-1 min-w-0 rounded-lg border px-3 py-2" placeholder="Title" value={f.title} onChange={(e) => updateFeatureLocal(f.id, { title: e.target.value })} />
                      <Toggle on={f.is_enabled} onChange={(v) => updateFeatureLocal(f.id, { is_enabled: v })} />
                      <button onClick={() => removeFeature(f.id)} className="text-red-500 p-1"><X size={18} /></button>
                    </div>
                    <input className="w-full rounded-lg border px-3 py-2" placeholder="Description" value={f.description || ''} onChange={(e) => updateFeatureLocal(f.id, { description: e.target.value })} />
                  </div>
                ))}
                <button onClick={addFeature} className="text-sm text-blue-600 font-medium">+ Add feature</button>
                <div>
                  <button disabled={saving.features} onClick={saveFeatures} className="flex items-center gap-2 rounded-lg bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-blue-700 disabled:opacity-60">
                    {saving.features && <Loader2 size={16} className="animate-spin" />} {saving.features ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </div>
            </SectionShell>
          );
        }

        if (s.section_key === 'categories') {
          return (
            <SectionShell key="categories" {...shellProps}>
              <Msg msg={msg.categories} />
              <div className="space-y-4 pt-4">
                <input className="w-full rounded-lg border px-3 py-2" placeholder="Section title" defaultValue={catSec?.title || ''} id="cat-title" />
                <textarea className="w-full rounded-lg border px-3 py-2" placeholder="Subtitle" rows={2} defaultValue={catSec?.subtitle || ''} id="cat-subtitle" />
                <div className="space-y-2 max-h-72 overflow-y-auto border rounded-lg p-3">
                  {categories.map((c) => {
                    const pick = catPicks.find((p) => p.category_id === c.id);
                    return (
                      <label key={c.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={pick?.is_enabled ?? false} onChange={(e) => toggleCategoryPick(c.id, e.target.checked)} />
                        {c.name}
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500">Leave all unchecked to show every category by default.</p>
                <button
                  disabled={saving.categories}
                  onClick={() => saveCategoriesSection(
                    (document.getElementById('cat-title') as HTMLInputElement).value,
                    (document.getElementById('cat-subtitle') as HTMLTextAreaElement).value
                  )}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving.categories && <Loader2 size={16} className="animate-spin" />} {saving.categories ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </SectionShell>
          );
        }

        if (s.section_key === 'featured_products' || s.section_key === 'best_sellers') {
          const isFeatured = s.section_key === 'featured_products';
          const sec = isFeatured ? featuredSec : bestSec;
          const picks = isFeatured ? featuredPicks : bestsellerPicks;
          return (
            <SectionShell key={s.section_key} {...shellProps}>
              <Msg msg={msg[s.section_key]} />
              <div className="space-y-4 pt-4">
                <input className="w-full rounded-lg border px-3 py-2" placeholder="Section title" defaultValue={sec?.title || ''} id={`${s.section_key}-title`} />
                <input className="w-full rounded-lg border px-3 py-2" placeholder="Subtitle" defaultValue={sec?.subtitle || ''} id={`${s.section_key}-subtitle`} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display mode</label>
                  <select id={`${s.section_key}-mode`} defaultValue={sec?.content?.display_mode || 'auto'} className="rounded-lg border px-3 py-2">
                    <option value="auto">Automatic ({isFeatured ? 'is_featured' : 'is_bestseller'} products)</option>
                    <option value="manual">Manually select products</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of products</label>
                  <input type="number" min={1} max={20} id={`${s.section_key}-count`} defaultValue={sec?.content?.count || (isFeatured ? 8 : 4)} className="w-24 rounded-lg border px-3 py-2" />
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto border rounded-lg p-3">
                  {products.map((p) => {
                    const pick = picks.find((pp) => pp.product_id === p.id);
                    return (
                      <label key={p.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={pick?.is_enabled ?? false} onChange={(e) => toggleProductPick(s.section_key as any, p.id, e.target.checked)} />
                        {p.name}
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500">Only used when display mode is "Manually select products".</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input className="rounded-lg border px-3 py-2" placeholder="View All text" id={`${s.section_key}-vatext`} defaultValue={sec?.content?.view_all_text || ''} />
                  <input className="rounded-lg border px-3 py-2" placeholder="View All link" id={`${s.section_key}-valink`} defaultValue={sec?.content?.view_all_link || ''} />
                </div>
                {!isFeatured && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Best Sellers image</label>
                    {bsPreview && <img src={bsPreview} alt="Best sellers preview" className="w-full max-h-40 object-cover rounded-lg mb-2" />}
                    <input type="file" accept="image/*" onChange={handleBsFile} />
                  </div>
                )}
                <button
                  disabled={saving[s.section_key]}
                  onClick={async () => {
                    const title = (document.getElementById(`${s.section_key}-title`) as HTMLInputElement).value;
                    const subtitle = (document.getElementById(`${s.section_key}-subtitle`) as HTMLInputElement).value;
                    const display_mode = (document.getElementById(`${s.section_key}-mode`) as HTMLSelectElement).value;
                    const count = Number((document.getElementById(`${s.section_key}-count`) as HTMLInputElement).value);
                    const view_all_text = (document.getElementById(`${s.section_key}-vatext`) as HTMLInputElement).value;
                    const view_all_link = (document.getElementById(`${s.section_key}-valink`) as HTMLInputElement).value;
                    let content: any = { display_mode, count, view_all_text, view_all_link };
                    if (!isFeatured) {
                      let image_url = sec?.content?.image_url || '';
                      if (bsFile) image_url = await uploadHomepageImage(bsFile, 'bestsellers', supabase);
                      content.image_url = image_url;
                      setBsFile(null);
                    }
                    saveProductSection(s.section_key as any, { title, subtitle, content });
                  }}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving[s.section_key] && <Loader2 size={16} className="animate-spin" />} {saving[s.section_key] ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </SectionShell>
          );
        }

        if (s.section_key === 'newsletter') {
          return (
            <SectionShell key="newsletter" {...shellProps}>
              <Msg msg={msg.newsletter} />
              <div className="space-y-4 pt-4">
                <input className="w-full rounded-lg border px-3 py-2" placeholder="Title" defaultValue={newsSec?.title || ''} id="news-title" />
                <textarea className="w-full rounded-lg border px-3 py-2" placeholder="Description" rows={2} defaultValue={newsSec?.subtitle || ''} id="news-subtitle" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <input className="rounded-lg border px-3 py-2" placeholder="Input placeholder" defaultValue={newsSec?.content?.placeholder || ''} id="news-placeholder" />
                  <input className="rounded-lg border px-3 py-2" placeholder="Button text" defaultValue={newsSec?.content?.button_text || ''} id="news-button" />
                </div>
                <button
                  disabled={saving.newsletter}
                  onClick={() => saveSimpleSection('newsletter', {
                    title: (document.getElementById('news-title') as HTMLInputElement).value,
                    subtitle: (document.getElementById('news-subtitle') as HTMLTextAreaElement).value,
                    content: {
                      placeholder: (document.getElementById('news-placeholder') as HTMLInputElement).value,
                      button_text: (document.getElementById('news-button') as HTMLInputElement).value,
                    },
                  })}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving.newsletter && <Loader2 size={16} className="animate-spin" />} {saving.newsletter ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </SectionShell>
          );
        }

        if (s.section_key === 'contact_cta') {
          return (
            <SectionShell key="contact_cta" {...shellProps}>
              <Msg msg={msg.contact_cta} />
              <div className="space-y-4 pt-4">
                <input className="w-full rounded-lg border px-3 py-2" placeholder="Title" defaultValue={contactSec?.title || ''} id="cta-title" />
                <textarea className="w-full rounded-lg border px-3 py-2" placeholder="Description" rows={2} defaultValue={contactSec?.subtitle || ''} id="cta-subtitle" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <input className="rounded-lg border px-3 py-2" placeholder="Button text" defaultValue={contactSec?.content?.button_text || ''} id="cta-button" />
                  <input className="rounded-lg border px-3 py-2" placeholder="Button link" defaultValue={contactSec?.content?.button_link || ''} id="cta-link" />
                </div>
                <button
                  disabled={saving.contact_cta}
                  onClick={() => saveSimpleSection('contact_cta', {
                    title: (document.getElementById('cta-title') as HTMLInputElement).value,
                    subtitle: (document.getElementById('cta-subtitle') as HTMLTextAreaElement).value,
                    content: {
                      button_text: (document.getElementById('cta-button') as HTMLInputElement).value,
                      button_link: (document.getElementById('cta-link') as HTMLInputElement).value,
                    },
                  })}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving.contact_cta && <Loader2 size={16} className="animate-spin" />} {saving.contact_cta ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </SectionShell>
          );
        }

        return null;
      })}
    </div>
  );
}
