import { useEffect, useState, useMemo } from "react";
import {
  ChevronDown, ChevronUp, Loader2, Check, AlertCircle, Search,
  Store, Globe, CreditCard, Package, Truck, Percent, Boxes, Users,
  Bell, Star, Palette, SlidersHorizontal, Shield, Plug, ServerCog,
} from "lucide-react";
import { getSettings, updateSettings, uploadPaymentQR, changeAdminPassword } from "../../lib/settings";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { supabaseAdmin as supabase } from "../../lib/supabaseAdmin";

// ---------------- Field config types ----------------
type FieldType = "text" | "email" | "phone" | "number" | "textarea" | "toggle" | "select" | "color";

interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  full?: boolean; // span full width
  help?: string;
}

interface SectionConfig {
  key: string;
  label: string;
  icon: any;
  description: string;
  keywords: string[];
  fields: FieldConfig[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s-]{7,15}$/;

function validateField(field: FieldConfig, value: any): string | null {
  const str = value === null || value === undefined ? "" : String(value);
  if (field.required && !str.trim()) return `${field.label} is required.`;
  if (!str.trim()) return null;
  if (field.type === "email" && !EMAIL_RE.test(str)) return "Enter a valid email address.";
  if (field.type === "phone" && !PHONE_RE.test(str)) return "Enter a valid phone number.";
  if (field.type === "number") {
    const num = Number(str);
    if (isNaN(num)) return `${field.label} must be a number.`;
    if (field.min !== undefined && num < field.min) return `${field.label} cannot be less than ${field.min}.`;
    if (field.max !== undefined && num > field.max) return `${field.label} cannot be more than ${field.max}.`;
  }
  return null;
}

const SECTIONS: SectionConfig[] = [
  {
    key: "store", label: "Store & Business", icon: Store,
    description: "Basic store identity and contact details.",
    keywords: ["store", "business", "address", "contact", "phone", "email", "status", "maintenance", "closed"],
    fields: [
      { key: "store_name", label: "Store Name", type: "text", required: true },
      { key: "store_email", label: "Business Email", type: "email", required: true },
      { key: "phone_1", label: "Phone Number 1", type: "phone" },
      { key: "phone_2", label: "Phone Number 2", type: "phone" },
      { key: "address", label: "Address", type: "textarea", full: true },
      { key: "business_city", label: "City", type: "text" },
      { key: "business_state", label: "State", type: "text" },
      { key: "business_country", label: "Country", type: "text" },
      { key: "business_pincode", label: "PIN / ZIP", type: "text" },
      { key: "store_status", label: "Store Status", type: "select", options: [{ value: "open", label: "Store Open" }, { value: "closed", label: "Closed / Maintenance" }] },
      { key: "store_closed_message", label: "Message shown to customers when closed", type: "textarea", full: true },
    ],
  },
  {
    key: "general", label: "General Preferences", icon: Globe,
    description: "Currency, region, and formatting defaults.",
    keywords: ["currency", "timezone", "language", "date", "time", "format", "region"],
    fields: [
      { key: "currency", label: "Currency", type: "select", options: [{ value: "INR", label: "INR (₹)" }, { value: "USD", label: "USD ($)" }, { value: "EUR", label: "EUR (€)" }] },
      { key: "timezone", label: "Time Zone", type: "text", placeholder: "Asia/Kolkata" },
      { key: "language", label: "Default Language", type: "select", options: [{ value: "en", label: "English" }, { value: "hi", label: "Hindi" }] },
      { key: "date_format", label: "Date Format", type: "select", options: [{ value: "DD/MM/YYYY", label: "DD/MM/YYYY" }, { value: "MM/DD/YYYY", label: "MM/DD/YYYY" }] },
      { key: "time_format", label: "Time Format", type: "select", options: [{ value: "24h", label: "24-hour" }, { value: "12h", label: "12-hour" }] },
    ],
  },
  {
    key: "payments", label: "Payments", icon: CreditCard,
    description: "Accepted payment methods and payment details customers see.",
    keywords: ["payment", "upi", "gpay", "phonepe", "qr", "cod", "cash on delivery", "online payment"],
    fields: [
      { key: "cod_enabled", label: "Cash on Delivery", type: "toggle" },
      { key: "online_payment_enabled", label: "Online / UPI Payment", type: "toggle" },
      { key: "upi_id", label: "UPI ID", type: "text" },
      { key: "gpay_number", label: "Google Pay Number", type: "phone" },
      { key: "phonepe_number", label: "PhonePe Number", type: "phone" },
      { key: "alternate_payment_number", label: "Alternate Payment Number", type: "phone" },
      { key: "payment_instructions", label: "Payment Instructions shown to customers", type: "textarea", full: true },
    ],
  },
  {
    key: "orders", label: "Orders", icon: Package,
    description: "How new orders and cancellations are handled.",
    keywords: ["orders", "cancellation", "confirm", "cod handling"],
    fields: [
      { key: "auto_confirm_orders", label: "Automatically confirm new orders", type: "toggle" },
      { key: "allow_customer_cancellation", label: "Allow customers to cancel orders", type: "toggle" },
      { key: "cancellation_window_hours", label: "Cancellation window (hours)", type: "number", min: 0, max: 168 },
    ],
  },
  {
    key: "shipping", label: "Shipping & Delivery", icon: Truck,
    description: "Delivery charges and timelines.",
    keywords: ["shipping", "delivery", "free shipping", "charge"],
    fields: [
      { key: "shipping_charge", label: "Shipping Charge (₹)", type: "number", min: 0 },
      { key: "free_shipping_above", label: "Free Shipping Above (₹)", type: "number", min: 0 },
      { key: "delivery_days", label: "Estimated Delivery (days)", type: "number", min: 1, max: 30 },
    ],
  },
  {
    key: "tax", label: "Taxes & Pricing", icon: Percent,
    description: "Tax rate and how it applies to product prices.",
    keywords: ["tax", "gst", "pricing", "inclusive"],
    fields: [
      { key: "tax_enabled", label: "Enable Tax", type: "toggle" },
      { key: "tax_percent", label: "Tax Percentage", type: "number", min: 0, max: 100 },
      { key: "tax_inclusive", label: "Prices are tax-inclusive", type: "toggle" },
    ],
  },
  {
    key: "inventory", label: "Inventory", icon: Boxes,
    description: "Stock thresholds and out-of-stock behaviour.",
    keywords: ["inventory", "stock", "low stock", "backorder", "out of stock"],
    fields: [
      { key: "low_stock_threshold", label: "Low-stock threshold (units)", type: "number", min: 0 },
      { key: "allow_backorder", label: "Allow purchase of out-of-stock products", type: "toggle" },
    ],
  },
  {
    key: "customers", label: "Customers & Accounts", icon: Users,
    description: "Registration and checkout behaviour for customers.",
    keywords: ["customers", "accounts", "guest checkout", "verification", "registration"],
    fields: [
      { key: "guest_checkout_enabled", label: "Allow guest checkout", type: "toggle" },
      { key: "email_verification_required", label: "Require email verification on signup", type: "toggle" },
    ],
  },
  {
    key: "notifications", label: "Notifications", icon: Bell,
    description: "Which admin and customer notifications are sent.",
    keywords: ["notifications", "alerts", "email", "order confirmation"],
    fields: [
      { key: "notify_new_order", label: "Admin: New order", type: "toggle" },
      { key: "notify_payment_received", label: "Admin: Payment received", type: "toggle" },
      { key: "notify_low_stock", label: "Admin: Low stock", type: "toggle" },
      { key: "notify_new_review", label: "Admin: New review", type: "toggle" },
      { key: "notify_order_confirmation", label: "Customer: Order confirmation", type: "toggle" },
      { key: "notify_order_shipped", label: "Customer: Order shipped", type: "toggle" },
      { key: "notify_order_delivered", label: "Customer: Order delivered", type: "toggle" },
    ],
  },
  {
    key: "reviews", label: "Reviews", icon: Star,
    description: "Whether customers can leave reviews and if they need approval.",
    keywords: ["reviews", "ratings", "approval"],
    fields: [
      { key: "reviews_enabled", label: "Allow customer reviews", type: "toggle" },
      { key: "reviews_require_approval", label: "Require approval before publishing", type: "toggle" },
    ],
  },
  {
    key: "appearance", label: "Appearance / Storefront", icon: Palette,
    description: "Global brand appearance. Homepage content lives in Homepage Manager.",
    keywords: ["appearance", "theme", "color", "brand", "storefront"],
    fields: [
      { key: "brand_color", label: "Primary Brand Color", type: "color" },
    ],
  },
  {
    key: "admin", label: "Admin Preferences", icon: SlidersHorizontal,
    description: "Preferences for the admin interface itself.",
    keywords: ["admin", "preferences", "items per page", "confirmation"],
    fields: [
      { key: "admin_items_per_page", label: "Items per page in tables", type: "select", options: [{ value: "10", label: "10" }, { value: "20", label: "20" }, { value: "50", label: "50" }] },
      { key: "admin_confirm_destructive_actions", label: "Ask for confirmation before deleting", type: "toggle" },
    ],
  },
];

function Field({ field, value, error, onChange }: { field: FieldConfig; value: any; error?: string | null; onChange: (v: any) => void }) {
  const base = `w-full border rounded-lg p-3 ${error ? "border-red-400" : "border-gray-300"}`;

  if (field.type === "toggle") {
    return (
      <div className="flex items-center justify-between gap-3 py-1">
        <span className="text-sm font-medium text-gray-700">{field.label}</span>
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${value ? "bg-green-500" : "bg-gray-300"}`}
        >
          <span className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>
    );
  }

  return (
    <div className={field.full ? "sm:col-span-2" : ""}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}{field.required && <span className="text-red-500"> *</span>}
      </label>
      {field.type === "textarea" ? (
        <textarea rows={3} className={base} placeholder={field.placeholder} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
      ) : field.type === "select" ? (
        <select className={base} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select...</option>
          {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : field.type === "color" ? (
        <input type="color" className="w-16 h-11 border rounded-lg" value={value || "#2563eb"} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          type={field.type === "number" ? "number" : "text"}
          className={base}
          placeholder={field.placeholder}
          value={value ?? ""}
          onChange={(e) => onChange(field.type === "number" ? e.target.value : e.target.value)}
        />
      )}
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}
function SectionCard({
  config, draft, dirty, errors, saving, message, onFieldChange, onSave, onCancel, defaultOpen, extra,
}: {
  config: { key: string; label: string; icon: any; description: string; fields: FieldConfig[] };
  draft: Record<string, any>;
  dirty: boolean;
  errors: Record<string, string | null>;
  saving: boolean;
  message: { type: "success" | "error"; text: string } | null;
  onFieldChange: (key: string, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  defaultOpen?: boolean;
  extra?: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const Icon = config.icon;

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-3 px-4 sm:px-6 py-4 text-left">
        <div className="flex items-center gap-3 min-w-0">
          <Icon size={18} className="text-gray-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{config.label}</p>
            <p className="text-xs text-gray-500 truncate">{config.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {dirty && <span className="text-xs text-amber-600 font-medium hidden sm:inline">Unsaved changes</span>}
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {open && (
        <div className="px-4 sm:px-6 pb-6 border-t pt-5">
          {message && (
            <div className={`mb-4 rounded-lg text-sm px-4 py-2 flex items-center gap-2 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {message.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {config.fields.map((f) => (
              <Field
                key={f.key}
                field={f}
                value={draft[f.key]}
                error={errors[f.key]}
                onChange={(v) => onFieldChange(f.key, v)}
              />
            ))}
          </div>

          {extra}

          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={onSave}
              disabled={saving || !dirty}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
            {dirty && (
              <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-lg border hover:bg-gray-50 font-medium">
                Cancel
              </button>
            )}
            {!dirty && !saving && <span className="text-xs text-gray-400">Saved</span>}
          </div>
        </div>
      )}
    </div>
  );
}
export function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Per-section local drafts + status, keyed by section key
  const [drafts, setDrafts] = useState<Record<string, Record<string, any>>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, { type: "success" | "error"; text: string } | null>>({});

  const [qrUploading, setQrUploading] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [maintenanceConfirm, setMaintenanceConfirm] = useState(false);

  const allSections = useMemo(() => [
    ...SECTIONS,
  ], []);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getSettings(supabaseAdmin);
      setSettings(data);
      const initialDrafts: Record<string, Record<string, any>> = {};
      allSections.forEach((s) => {
        initialDrafts[s.key] = Object.fromEntries(s.fields.map((f) => [f.key, data?.[f.key]]));
      });
      setDrafts(initialDrafts);
    } catch (err: any) {
      setLoadError(err.message || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }

  function isDirty(sectionKey: string, fields: FieldConfig[]) {
    const draft = drafts[sectionKey];
    if (!draft || !settings) return false;
    return fields.some((f) => String(draft[f.key] ?? "") !== String(settings[f.key] ?? ""));
  }

  function fieldErrors(fields: FieldConfig[], draft: Record<string, any>) {
    const errs: Record<string, string | null> = {};
    fields.forEach((f) => { errs[f.key] = validateField(f, draft[f.key]); });
    return errs;
  }

  function onFieldChange(sectionKey: string, fieldKey: string, value: any) {
    setDrafts((prev) => ({ ...prev, [sectionKey]: { ...prev[sectionKey], [fieldKey]: value } }));
  }

  function cancelSection(sectionKey: string, fields: FieldConfig[]) {
    setDrafts((prev) => ({ ...prev, [sectionKey]: Object.fromEntries(fields.map((f) => [f.key, settings?.[f.key]])) }));
    setMessages((prev) => ({ ...prev, [sectionKey]: null }));
  }

  async function saveSection(sectionKey: string, fields: FieldConfig[]) {
    const draft = drafts[sectionKey];
    const errs = fieldErrors(fields, draft);
    if (Object.values(errs).some(Boolean)) {
      setMessages((prev) => ({ ...prev, [sectionKey]: { type: "error", text: "Fix the highlighted fields before saving." } }));
      return;
    }
    setSaving((prev) => ({ ...prev, [sectionKey]: true }));
    setMessages((prev) => ({ ...prev, [sectionKey]: null }));
    try {
      const payload: Record<string, any> = { id: settings.id };
      fields.forEach((f) => {
        payload[f.key] = f.type === "number" ? (draft[f.key] === "" || draft[f.key] === null ? null : Number(draft[f.key])) : draft[f.key];
      });
      await updateSettings(payload, supabaseAdmin);
      setSettings((prev: any) => ({ ...prev, ...payload }));
      setMessages((prev) => ({ ...prev, [sectionKey]: { type: "success", text: "Saved successfully." } }));
    } catch (err: any) {
      setMessages((prev) => ({ ...prev, [sectionKey]: { type: "error", text: err.message || "Failed to save." } }));
    } finally {
      setSaving((prev) => ({ ...prev, [sectionKey]: false }));
    }
  }

  async function quickToggle(key: string, value: boolean | string) {
    if (!settings) return;
    const prevValue = settings[key];
    setSettings((prev: any) => ({ ...prev, [key]: value }));
    try {
      await updateSettings({ id: settings.id, [key]: value }, supabaseAdmin);
    } catch (err) {
      setSettings((prev: any) => ({ ...prev, [key]: prevValue }));
    }
  }

  async function handleQrUpload(file: File) {
    setQrUploading(true);
    try {
      const url = await uploadPaymentQR(file, supabaseAdmin);
      await updateSettings({ id: settings.id, payment_qr: url }, supabaseAdmin);
      setSettings((prev: any) => ({ ...prev, payment_qr: url }));
      setMessages((prev) => ({ ...prev, payments: { type: "success", text: "QR code updated." } }));
    } catch (err: any) {
      setMessages((prev) => ({ ...prev, payments: { type: "error", text: err.message || "QR upload failed." } }));
    } finally {
      setQrUploading(false);
    }
  }

  async function handleChangePassword() {
    if (passwordValue.length < 6) {
      setPasswordMsg({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    setPasswordSaving(true);
    setPasswordMsg(null);
    try {
      await changeAdminPassword(passwordValue, supabaseAdmin);
      setPasswordValue("");
      setPasswordMsg({ type: "success", text: "Password updated." });
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Failed to update password." });
    } finally {
      setPasswordSaving(false);
    }
  }

  async function toggleMaintenance() {
    setMaintenanceConfirm(false);
    await quickToggle("maintenance_mode", !settings.maintenance_mode);
  }

  const q = search.trim().toLowerCase();
  const visibleSections = q
    ? allSections.filter((s) => s.label.toLowerCase().includes(q) || s.keywords.some((k) => k.includes(q)))
    : allSections;

  if (loading) return <div className="p-8 text-gray-500">Loading settings...</div>;

  if (loadError || !settings) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-xl border p-8 text-center">
          <AlertCircle className="mx-auto text-red-500 mb-2" size={28} />
          <p className="font-medium text-gray-800 mb-1">Couldn't load settings</p>
          <p className="text-sm text-gray-500 mb-4">{loadError}</p>
          <button onClick={loadSettings} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-gray-500">Manage your store, orders, payments, customers, notifications and system preferences.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search settings..."
          className="w-full border rounded-lg pl-10 pr-4 py-2.5 bg-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      
      <div className="bg-white rounded-xl border p-4 sm:p-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">Quick Settings</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { key: "store_status", label: "Store Open", isOpen: true },
          ].map((q) => (
            <div key={q.key} className="flex items-center justify-between gap-2">
              <span className="text-sm text-gray-600">{q.label}</span>
              <button
                type="button"
                onClick={() => quickToggle("store_status", settings.store_status === "open" ? "closed" : "open")}
                className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${settings.store_status === "open" ? "bg-green-500" : "bg-gray-300"}`}
              >
                <span className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${settings.store_status === "open" ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
          {[
            { key: "cod_enabled", label: "Cash on Delivery" },
            { key: "online_payment_enabled", label: "Online Payments" },
            { key: "notify_low_stock", label: "Low Stock Alerts" },
            { key: "reviews_enabled", label: "Customer Reviews" },
          ].map((q) => (
            <div key={q.key} className="flex items-center justify-between gap-2">
              <span className="text-sm text-gray-600">{q.label}</span>
              <button
                type="button"
                onClick={() => quickToggle(q.key, !settings[q.key])}
                className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${settings[q.key] ? "bg-green-500" : "bg-gray-300"}`}
              >
                <span className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${settings[q.key] ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>


      {visibleSections.map((s) => {
        const draft = drafts[s.key] || {};
        const dirty = isDirty(s.key, s.fields);
        const errs = fieldErrors(s.fields, draft);

        let extra: React.ReactNode = null;
        if (s.key === "payments") {
          extra = (
            <div className="mt-5 pt-5 border-t">
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment QR Code</label>
              <div className="flex items-center gap-4 flex-wrap">
                <img
                  src={settings.payment_qr || "https://placehold.co/120x120?text=QR"}
                  alt="Payment QR"
                  className="w-24 h-24 object-contain rounded-lg border"
                />
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer text-sm">
                  {qrUploading && <Loader2 size={14} className="animate-spin" />}
                  Upload QR Code
                  <input type="file" accept="image/*" hidden disabled={qrUploading} onChange={(e) => e.target.files?.[0] && handleQrUpload(e.target.files[0])} />
                </label>
              </div>
            </div>
          );
        }

        return (
          <SectionCard
            key={s.key}
            config={s}
            draft={draft}
            dirty={dirty}
            errors={errs}
            saving={!!saving[s.key]}
            message={messages[s.key] || null}
            onFieldChange={(k, v) => onFieldChange(s.key, k, v)}
            onSave={() => saveSection(s.key, s.fields)}
            onCancel={() => cancelSection(s.key, s.fields)}
            extra={extra}
          />
        );
      })}
      {(!q || "integrations".includes(q)) && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-4">
            <Plug size={18} className="text-gray-400" />
            <div>
              <p className="font-semibold text-gray-900">Integrations</p>
              <p className="text-xs text-gray-500">Connected services. Keys are never shown here.</p>
            </div>
          </div>
          <div className="px-4 sm:px-6 pb-5 pt-1 border-t grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: "Supabase Database", status: "Connected" },
              { name: "Supabase Auth", status: "Connected" },
              { name: "Supabase Storage", status: "Connected" },
            ].map((i) => (
              <div key={i.name} className="flex items-center justify-between border rounded-lg px-4 py-3">
                <span className="text-sm text-gray-700">{i.name}</span>
                <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">{i.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {(!q || "security password login".includes(q)) && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-4">
            <Shield size={18} className="text-gray-400" />
            <div>
              <p className="font-semibold text-gray-900">Security</p>
              <p className="text-xs text-gray-500">Change the password for this admin account.</p>
            </div>
          </div>
          <div className="px-4 sm:px-6 pb-6 pt-1 border-t">
            {passwordMsg && (
              <div className={`mb-4 rounded-lg text-sm px-4 py-2 flex items-center gap-2 ${passwordMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {passwordMsg.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
                {passwordMsg.text}
              </div>
            )}
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              className="w-full sm:w-80 border rounded-lg p-3 mb-4"
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
              placeholder="At least 6 characters"
            />
            <div>
              <button
                onClick={handleChangePassword}
                disabled={passwordSaving || !passwordValue}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
              >
                {passwordSaving && <Loader2 size={16} className="animate-spin" />}
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
      {(!q || "system maintenance".includes(q)) && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-4">
            <ServerCog size={18} className="text-gray-400" />
            <div>
              <p className="font-semibold text-gray-900">System</p>
              <p className="text-xs text-gray-500">Application information.</p>
            </div>
          </div>
          <div className="px-4 sm:px-6 pb-5 pt-1 border-t text-sm text-gray-600 space-y-1">
            <p>Environment: Production</p>
            <p>Database: Supabase</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-4 sm:px-6 py-4">
          <p className="font-semibold text-gray-900">Account</p>
          <p className="text-xs text-gray-500">Logout from the admin dashboard.</p>
        </div>
        <div className="px-4 sm:px-6 pb-6 border-t pt-4">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              localStorage.removeItem("adminLoggedIn");
              window.location.href = "/admin/login";
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border-2 border-red-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4">
          <p className="font-semibold text-red-700">Danger Zone</p>
          <p className="text-xs text-gray-500">Irreversible or store-wide actions. Handle with care.</p>
        </div>
        <div className="px-4 sm:px-6 pb-6 border-t pt-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium text-gray-800">Maintenance Mode</p>
            <p className="text-xs text-gray-500">{settings.maintenance_mode ? "Currently ON — customers cannot use the store." : "Currently OFF."}</p>
          </div>
          <button
            type="button"
            onClick={() => setMaintenanceConfirm(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${settings.maintenance_mode ? "bg-gray-200 text-gray-800 hover:bg-gray-300" : "bg-red-600 text-white hover:bg-red-700"}`}
          >
            {settings.maintenance_mode ? "Disable Maintenance Mode" : "Enable Maintenance Mode"}
          </button>
        </div>
      </div>

      {maintenanceConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <p className="font-semibold mb-1">
              {settings.maintenance_mode ? "Disable maintenance mode?" : "Enable maintenance mode?"}
            </p>
            <p className="text-sm text-gray-500 mb-5">
              {settings.maintenance_mode ? "The store will become available to customers again." : "Customers will be unable to use the store until this is turned off."}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setMaintenanceConfirm(false)} className="flex-1 border rounded-lg py-2.5 font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={toggleMaintenance} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 font-medium">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}