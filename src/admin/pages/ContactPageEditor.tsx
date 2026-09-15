import { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { supabaseAdmin as supabase } from '../../lib/supabaseAdmin';
interface HeroForm {
  hero_heading: string;
  hero_description: string;
}

interface FormSettingsForm {
  form_heading: string;
}

interface GetInTouchForm {
  get_in_touch_heading: string;
  get_in_touch_description: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
}

interface FaqForm {
  faq_heading: string;
  faq_description: string;
  faq_link_text: string;
  faq_link_url: string;
}

interface MapForm {
  map_image_url: string;
  map_link: string;
}

type Message = { type: 'success' | 'error'; text: string } | null;

const HEADING_LIMIT = 80;
const DESCRIPTION_LIMIT = 300;

const EMPTY_HERO: HeroForm = { hero_heading: '', hero_description: '' };
const EMPTY_FORM_SETTINGS: FormSettingsForm = { form_heading: '' };
const EMPTY_GET_IN_TOUCH: GetInTouchForm = {
  get_in_touch_heading: '',
  get_in_touch_description: '',
  address: '',
  phone: '',
  email: '',
  hours: '',
};
const EMPTY_FAQ: FaqForm = {
  faq_heading: '',
  faq_description: '',
  faq_link_text: '',
  faq_link_url: '',
};
const EMPTY_MAP: MapForm = { map_image_url: '', map_link: '' };
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
async function uploadContactImage(file: File, prefix: string): Promise<{ url?: string; error?: string }> {
  const ext = file.name.split('.').pop();
  const path = `${prefix}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('about-images').upload(path, file, { upsert: true });
  if (error) return { error: error.message };
  const { data } = supabase.storage.from('about-images').getPublicUrl(path);
  return { url: data.publicUrl };
}

export function ContactPageEditor() {
  
  const [heroForm, setHeroForm] = useState<HeroForm>(EMPTY_HERO);
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroMessage, setHeroMessage] = useState<Message>(null);

  
  const [formSettings, setFormSettings] = useState<FormSettingsForm>(EMPTY_FORM_SETTINGS);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [formSettingsSaving, setFormSettingsSaving] = useState(false);
  const [formSettingsMessage, setFormSettingsMessage] = useState<Message>(null);

  const [getInTouchForm, setGetInTouchForm] = useState<GetInTouchForm>(EMPTY_GET_IN_TOUCH);
  const [getInTouchSaving, setGetInTouchSaving] = useState(false);
  const [getInTouchMessage, setGetInTouchMessage] = useState<Message>(null);

  
  const [faqForm, setFaqForm] = useState<FaqForm>(EMPTY_FAQ);
  const [faqSaving, setFaqSaving] = useState(false);
  const [faqMessage, setFaqMessage] = useState<Message>(null);

  const [mapForm, setMapForm] = useState<MapForm>(EMPTY_MAP);
  const [mapImageFile, setMapImageFile] = useState<File | null>(null);
  const [mapPreview, setMapPreview] = useState('');
  const [mapSaving, setMapSaving] = useState(false);
  const [mapMessage, setMapMessage] = useState<Message>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: page } = await supabase.from('contact_page').select('*').eq('id', 1).maybeSingle();

      if (page) {
        setHeroForm({
          hero_heading: page.hero_heading ?? '',
          hero_description: page.hero_description ?? '',
        });

        setFormSettings({ form_heading: page.form_heading ?? '' });
        setSubjects(page.subjects ?? []);

        setGetInTouchForm({
          get_in_touch_heading: page.get_in_touch_heading ?? '',
          get_in_touch_description: page.get_in_touch_description ?? '',
          address: page.address ?? '',
          phone: page.phone ?? '',
          email: page.email ?? '',
          hours: page.hours ?? '',
        });

        setFaqForm({
          faq_heading: page.faq_heading ?? '',
          faq_description: page.faq_description ?? '',
          faq_link_text: page.faq_link_text ?? '',
          faq_link_url: page.faq_link_url ?? '',
        });

        setMapForm({
          map_image_url: page.map_image_url ?? '',
          map_link: page.map_link ?? '',
        });
        setMapPreview(page.map_image_url ?? '');
      }

      setLoading(false);
    }
    load();
  }, []);
  function handleHeroChange<K extends keyof HeroForm>(field: K, value: HeroForm[K]) {
    setHeroForm((f) => ({ ...f, [field]: value }));
  }

  async function handleHeroSubmit(e: FormEvent) {
    e.preventDefault();
    setHeroMessage(null);

    if (!heroForm.hero_heading.trim() || !heroForm.hero_description.trim()) {
      setHeroMessage({ type: 'error', text: 'Heading and description are required.' });
      return;
    }

    setHeroSaving(true);
    const { error } = await supabase.from('contact_page').upsert({
      id: 1,
      hero_heading: heroForm.hero_heading,
      hero_description: heroForm.hero_description,
      updated_at: new Date().toISOString(),
    });

    setHeroSaving(false);
    if (error) {
      setHeroMessage({ type: 'error', text: `Save failed: ${error.message}` });
      return;
    }
    setHeroMessage({ type: 'success', text: 'Hero section updated.' });
  }
  function addSubject() {
    setSubjects((rows) => [...rows, '']);
  }

  function updateSubject(index: number, value: string) {
    setSubjects((rows) => rows.map((r, i) => (i === index ? value : r)));
  }

  function removeSubject(index: number) {
    setSubjects((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleFormSettingsSubmit(e: FormEvent) {
    e.preventDefault();
    setFormSettingsMessage(null);

    if (!formSettings.form_heading.trim()) {
      setFormSettingsMessage({ type: 'error', text: 'Form heading is required.' });
      return;
    }
    const cleanedSubjects = subjects.map((s) => s.trim()).filter(Boolean);
    if (cleanedSubjects.length === 0) {
      setFormSettingsMessage({ type: 'error', text: 'Add at least one subject option.' });
      return;
    }

    setFormSettingsSaving(true);
    const { error } = await supabase.from('contact_page').upsert({
      id: 1,
      form_heading: formSettings.form_heading,
      subjects: cleanedSubjects,
      updated_at: new Date().toISOString(),
    });

    setFormSettingsSaving(false);
    if (error) {
      setFormSettingsMessage({ type: 'error', text: `Save failed: ${error.message}` });
      return;
    }
    setSubjects(cleanedSubjects);
    setFormSettingsMessage({ type: 'success', text: 'Form settings updated.' });
  }

  function handleGetInTouchChange<K extends keyof GetInTouchForm>(field: K, value: GetInTouchForm[K]) {
    setGetInTouchForm((f) => ({ ...f, [field]: value }));
  }

  async function handleGetInTouchSubmit(e: FormEvent) {
    e.preventDefault();
    setGetInTouchMessage(null);

    if (!getInTouchForm.get_in_touch_heading.trim()) {
      setGetInTouchMessage({ type: 'error', text: 'Section heading is required.' });
      return;
    }

    setGetInTouchSaving(true);
    const { error } = await supabase.from('contact_page').upsert({
      id: 1,
      get_in_touch_heading: getInTouchForm.get_in_touch_heading,
      get_in_touch_description: getInTouchForm.get_in_touch_description,
      address: getInTouchForm.address,
      phone: getInTouchForm.phone,
      email: getInTouchForm.email,
      hours: getInTouchForm.hours,
      updated_at: new Date().toISOString(),
    });

    setGetInTouchSaving(false);
    if (error) {
      setGetInTouchMessage({ type: 'error', text: `Save failed: ${error.message}` });
      return;
    }
    setGetInTouchMessage({ type: 'success', text: 'Get in Touch section updated.' });
  }
  function handleFaqChange<K extends keyof FaqForm>(field: K, value: FaqForm[K]) {
    setFaqForm((f) => ({ ...f, [field]: value }));
  }

  async function handleFaqSubmit(e: FormEvent) {
    e.preventDefault();
    setFaqMessage(null);

    setFaqSaving(true);
    const { error } = await supabase.from('contact_page').upsert({
      id: 1,
      faq_heading: faqForm.faq_heading,
      faq_description: faqForm.faq_description,
      faq_link_text: faqForm.faq_link_text,
      faq_link_url: faqForm.faq_link_url,
      updated_at: new Date().toISOString(),
    });

    setFaqSaving(false);
    if (error) {
      setFaqMessage({ type: 'error', text: `Save failed: ${error.message}` });
      return;
    }
    setFaqMessage({ type: 'success', text: 'FAQ card updated.' });
  }

  function handleMapLinkChange(value: string) {
    setMapForm((f) => ({ ...f, map_link: value }));
  }

  function handleMapFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMapImageFile(file);
    setMapPreview(URL.createObjectURL(file));
  }

  async function handleMapSubmit(e: FormEvent) {
    e.preventDefault();
    setMapMessage(null);
    setMapSaving(true);

    let imageUrl = mapForm.map_image_url;
    if (mapImageFile) {
      const { url, error } = await uploadContactImage(mapImageFile, 'contact-map');
      if (error) {
        setMapSaving(false);
        setMapMessage({ type: 'error', text: `Image upload failed: ${error}` });
        return;
      }
      imageUrl = url!;
    }

    const { error } = await supabase.from('contact_page').upsert({
      id: 1,
      map_image_url: imageUrl,
      map_link: mapForm.map_link,
      updated_at: new Date().toISOString(),
    });

    setMapSaving(false);
    if (error) {
      setMapMessage({ type: 'error', text: `Save failed: ${error.message}` });
      return;
    }
    setMapForm((f) => ({ ...f, map_image_url: imageUrl }));
    setMapImageFile(null);
    setMapMessage({ type: 'success', text: 'Map section updated.' });
  }
  if (loading) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Contact Page</h1>
        <div className="bg-white rounded-xl border p-6 h-64 skeleton" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Contact Page</h1>
        <p className="text-gray-500">Edit each section below. Sections save independently.</p>
      </div>
      <form onSubmit={handleHeroSubmit} className="bg-white rounded-xl border p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">Hero Section</h2>
        <MessageBanner message={heroMessage} />

        <div>
          <div className="flex justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Heading</label>
            <span className="text-xs text-gray-400">{heroForm.hero_heading.length}/{HEADING_LIMIT}</span>
          </div>
          <input
            type="text"
            value={heroForm.hero_heading}
            maxLength={HEADING_LIMIT}
            onChange={(e) => handleHeroChange('hero_heading', e.target.value)}
            className="input"
          />
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
            className="input"
          />
        </div>

        <button type="submit" disabled={heroSaving} className="flex items-center gap-2 rounded-lg bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-blue-700 disabled:opacity-60">
          {heroSaving && <Loader2 size={16} className="animate-spin" />}
          {heroSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
      <form onSubmit={handleFormSettingsSubmit} className="bg-white rounded-xl border p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">Message Form Settings</h2>
        <MessageBanner message={formSettingsMessage} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Form heading</label>
          <input
            type="text"
            value={formSettings.form_heading}
            maxLength={HEADING_LIMIT}
            onChange={(e) => setFormSettings({ form_heading: e.target.value })}
            className="input"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Subject dropdown options</label>
            <button type="button" onClick={addSubject} className="btn-secondary text-sm flex items-center gap-1">
              <Plus size={16} /> Add Option
            </button>
          </div>
          <div className="space-y-2">
            {subjects.length === 0 && <p className="text-sm text-gray-400">No options yet. Add one above.</p>}
            {subjects.map((subject, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => updateSubject(i, e.target.value)}
                  className="input text-sm flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeSubject(i)}
                  className="text-gray-400 hover:text-red-600"
                  aria-label="Remove option"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={formSettingsSaving} className="flex items-center gap-2 rounded-lg bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-blue-700 disabled:opacity-60">
          {formSettingsSaving && <Loader2 size={16} className="animate-spin" />}
          {formSettingsSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* ============ Get in Touch ============ */}
      <form onSubmit={handleGetInTouchSubmit} className="bg-white rounded-xl border p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">Get in Touch</h2>
        <MessageBanner message={getInTouchMessage} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Section heading</label>
          <input
            type="text"
            value={getInTouchForm.get_in_touch_heading}
            maxLength={HEADING_LIMIT}
            onChange={(e) => handleGetInTouchChange('get_in_touch_heading', e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={getInTouchForm.get_in_touch_description}
            maxLength={DESCRIPTION_LIMIT}
            onChange={(e) => handleGetInTouchChange('get_in_touch_description', e.target.value)}
            rows={2}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea
            value={getInTouchForm.address}
            onChange={(e) => handleGetInTouchChange('address', e.target.value)}
            rows={2}
            className="input"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              value={getInTouchForm.phone}
              onChange={(e) => handleGetInTouchChange('phone', e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={getInTouchForm.email}
              onChange={(e) => handleGetInTouchChange('email', e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
          <input
            type="text"
            value={getInTouchForm.hours}
            onChange={(e) => handleGetInTouchChange('hours', e.target.value)}
            placeholder="Mon-Sat: 9AM-8PM, Sun: 10AM-6PM"
            className="input"
          />
        </div>

        <button type="submit" disabled={getInTouchSaving} className="flex items-center gap-2 rounded-lg bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-blue-700 disabled:opacity-60">
          {getInTouchSaving && <Loader2 size={16} className="animate-spin" />}
          {getInTouchSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* ============ FAQ Card ============ */}
      <form onSubmit={handleFaqSubmit} className="bg-white rounded-xl border p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">FAQ Card</h2>
        <MessageBanner message={faqMessage} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
          <input
            type="text"
            value={faqForm.faq_heading}
            maxLength={HEADING_LIMIT}
            onChange={(e) => handleFaqChange('faq_heading', e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={faqForm.faq_description}
            maxLength={DESCRIPTION_LIMIT}
            onChange={(e) => handleFaqChange('faq_description', e.target.value)}
            rows={2}
            className="input"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link text</label>
            <input
              type="text"
              value={faqForm.faq_link_text}
              onChange={(e) => handleFaqChange('faq_link_text', e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
            <input
              type="text"
              value={faqForm.faq_link_url}
              onChange={(e) => handleFaqChange('faq_link_url', e.target.value)}
              className="input"
            />
          </div>
        </div>

        <button type="submit" disabled={faqSaving} className="flex items-center gap-2 rounded-lg bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-blue-700 disabled:opacity-60">
          {faqSaving && <Loader2 size={16} className="animate-spin" />}
          {faqSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
      <form onSubmit={handleMapSubmit} className="bg-white rounded-xl border p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">Map Section</h2>
        <MessageBanner message={mapMessage} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Map image</label>
          {mapPreview && (
            <img src={mapPreview} alt="Map preview" className="w-full max-h-56 object-cover rounded-lg mb-3" />
          )}
          <input type="file" accept="image/*" onChange={handleMapFileSelect} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">"View on Map" link URL</label>
          <input
            type="text"
            value={mapForm.map_link}
            onChange={(e) => handleMapLinkChange(e.target.value)}
            className="input"
          />
        </div>

        <button type="submit" disabled={mapSaving} className="flex items-center gap-2 rounded-lg bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-blue-700 disabled:opacity-60">
          {mapSaving && <Loader2 size={16} className="animate-spin" />}
          {mapSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}