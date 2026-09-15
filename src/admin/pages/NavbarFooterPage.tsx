import { useEffect, useState, type ReactNode } from "react";
import {
  Save,
  RotateCcw,
  Plus,
  Trash2,
  GripVertical,
  Navigation,
  PanelBottom,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

type NavItem = {
  id: string;
  label: string;
  path: string;
  enabled: boolean;
};

type FooterLink = {
  id: string;
  label: string;
  path: string;
  enabled: boolean;
};
type FooterPageSection = {
  id: string;
  heading: string;
  content: string;
};

type FooterPage = {
  title: string;
  intro: string;
  sections: FooterPageSection[];
};
type SiteNavigation = {
  id: number;
  navbar_enabled: boolean;
  brand_name: string;
  brand_logo_url: string;
  show_brand_name: boolean;
  nav_items: NavItem[];

  show_search: boolean;
  show_wishlist: boolean;
  show_orders: boolean;
  show_cart: boolean;
  show_profile: boolean;

footer_enabled: boolean;
footer_description: string;
footer_quick_links: FooterLink[];
footer_service_links: FooterLink[];

footer_pages: Record<string, FooterPage>;


  footer_address: string;
  footer_phone: string;
  footer_email: string;
  footer_copyright: string;
  footer_developer_text: string;
  footer_developer_url: string;

  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  youtube_url: string;

  favicon_url: string;
};

const DEFAULT_SETTINGS: SiteNavigation = {
  id: 1,

  navbar_enabled: true,
  brand_name: "KitchenPro",
  brand_logo_url: "",
  show_brand_name: true,

  nav_items: [
    { id: "home", label: "Home", path: "/", enabled: true },
    { id: "products", label: "Products", path: "/products", enabled: true },
    { id: "about", label: "About", path: "/about", enabled: true },
    { id: "contact", label: "Contact", path: "/contact", enabled: true },
  ],

  show_search: true,
  show_wishlist: true,
  show_orders: true,
  show_cart: true,
  show_profile: true,

footer_enabled: true,

footer_description: "",

footer_quick_links: [
  {
    id: "products",
    label: "All Products",
    path: "/products",
    enabled: true,
  },
  {
    id: "cookware",
    label: "Cookware",
    path: "/products?category=Cookware",
    enabled: true,
  },
  {
    id: "appliances",
    label: "Kitchen Appliances",
    path: "/products?category=Kitchen Appliances",
    enabled: true,
  },
  {
    id: "about",
    label: "About Us",
    path: "/about",
    enabled: true,
  },
  {
    id: "contact",
    label: "Contact",
    path: "/contact",
    enabled: true,
  },
],

footer_service_links: [
  {
    id: "faq",
    label: "FAQs",
    path: "/faq",
    enabled: true,
  },
  {
    id: "shipping",
    label: "Shipping Policy",
    path: "/shipping-policy",
    enabled: true,
  },
  {
    id: "returns",
    label: "Returns & Refunds",
    path: "/returns-refunds",
    enabled: true,
  },
  {
    id: "terms",
    label: "Terms & Conditions",
    path: "/terms",
    enabled: true,
  },
  {
    id: "privacy",
    label: "Privacy Policy",
    path: "/privacy-policy",
    enabled: true,
  },
],
footer_pages: {
  faq: { title: "Frequently Asked Questions", intro: "Find answers to common questions about our products, orders, shipping and returns.", sections: [{ id: "faq-general", heading: "General Questions", content: "Add your frequently asked questions and answers here." }] },
  shipping: { title: "Shipping Policy", intro: "We are committed to delivering your orders safely and on time.", sections: [{ id: "shipping-delivery", heading: "Delivery", content: "Add your shipping and delivery information here." }, { id: "shipping-time", heading: "Delivery Time", content: "Add your expected delivery time here." }] },
  returns: { title: "Returns & Refunds", intro: "Customer satisfaction is our priority.", sections: [{ id: "returns", heading: "Returns", content: "Returns are accepted within 7 days of delivery.\n\nProducts must be unused, undamaged, and returned in their original packaging." }, { id: "non-returnable", heading: "Non-Returnable Items", content: "Used products\n\nCustomized products\n\nProducts damaged due to customer misuse" }, { id: "refunds", heading: "Refunds", content: "Refunds are processed after the returned product has been inspected.\n\nApproved refunds are credited within 5–7 business days." }] },
  terms: { title: "Terms & Conditions", intro: "Please read these terms and conditions carefully before using our website.", sections: [{ id: "terms-use", heading: "Use of Website", content: "Add your website usage terms here." }, { id: "terms-orders", heading: "Orders", content: "Add your order terms here." }, { id: "terms-payment", heading: "Payments", content: "Add your payment terms here." }] },
  privacy: { title: "Privacy Policy", intro: "Your privacy is important to us.", sections: [{ id: "privacy-collect", heading: "Information We Collect", content: "Name\n\nEmail Address\n\nPhone Number\n\nShipping Address" }, { id: "privacy-use", heading: "How We Use Your Information", content: "Process your orders\n\nDeliver products\n\nProvide customer support\n\nImprove our services" }] },
},

footer_address: "",
footer_phone: "",
footer_email: "",
footer_copyright: "",
footer_developer_text: "",
footer_developer_url: "",

facebook_url: "",
  instagram_url: "",
  twitter_url: "",
  youtube_url: "",

  favicon_url: "",
};

type Tab = "navbar" | "footer" | "footer-pages" | "favicon";

export function NavbarFooterPage() {
  const [settings, setSettings] = useState<SiteNavigation>(DEFAULT_SETTINGS);
  const [original, setOriginal] = useState<SiteNavigation>(DEFAULT_SETTINGS);
  const [tab, setTab] = useState<Tab>("navbar");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);

    const { data, error } = await supabaseAdmin
      .from("site_navigation")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: "Failed to load Navbar & Footer settings.",
      });
    } else if (data) {
      const loaded: SiteNavigation = {
        ...DEFAULT_SETTINGS,
        ...data,
        nav_items: data.nav_items ?? DEFAULT_SETTINGS.nav_items,
        footer_quick_links: data.footer_quick_links ?? DEFAULT_SETTINGS.footer_quick_links,
        footer_service_links: data.footer_service_links ?? DEFAULT_SETTINGS.footer_service_links,
        footer_pages: { ...DEFAULT_SETTINGS.footer_pages, ...(data.footer_pages ?? {}) },
      };

      setSettings(loaded);
      setOriginal(loaded);
    }

    setLoading(false);
  }

  async function saveSettings() {
    setSaving(true);
    setMessage(null);

    const { error } = await supabaseAdmin
      .from("site_navigation")
      .upsert(
        {
          ...settings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (error) {
      console.error(error);

      setMessage({
        type: "error",
        text: error.message || "Failed to save settings.",
      });
    } else {
      setOriginal(settings);

      setMessage({
        type: "success",
        text: "Navbar & Footer settings saved successfully.",
      });
    }

    setSaving(false);
  }

  function resetSettings() {
    setSettings(original);
    setMessage(null);
  }

  function update<K extends keyof SiteNavigation>(
    field: K,
    value: SiteNavigation[K]
  ) {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateNavItem(
    index: number,
    field: keyof NavItem,
    value: string | boolean
  ) {
    const items = [...settings.nav_items];

    items[index] = {
      ...items[index],
      [field]: value,
    };

    update("nav_items", items);
  }

  function addNavItem() {
    update("nav_items", [
      ...settings.nav_items,
      {
        id: crypto.randomUUID(),
        label: "New Link",
        path: "/",
        enabled: true,
      },
    ]);
  }

  function removeNavItem(index: number) {
    update(
      "nav_items",
      settings.nav_items.filter((_, i) => i !== index)
    );
  }

  function moveNavItem(index: number, direction: "up" | "down") {
    const items = [...settings.nav_items];

    const target = direction === "up" ? index - 1 : index + 1;

    if (target < 0 || target >= items.length) return;

    [items[index], items[target]] = [items[target], items[index]];

    update("nav_items", items);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <Navigation className="text-primary-600" size={30} />

            <h1 className="text-3xl font-bold text-gray-900">
              Navbar & Footer
            </h1>
          </div>

          <p className="text-gray-600 mt-2">
            Manage your storefront navigation, footer and favicon.
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}

          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl mb-6">
        <div className="flex overflow-x-auto border-b">
          <TabButton
            active={tab === "navbar"}
            onClick={() => setTab("navbar")}
            icon={<Navigation size={18} />}
            label="Navbar"
          />

          <TabButton
            active={tab === "footer"}
            onClick={() => setTab("footer")}
            icon={<PanelBottom size={18} />}
            label="Footer"
          />

          <TabButton
            active={tab === "footer-pages"}
            onClick={() => setTab("footer-pages")}
            icon={<PanelBottom size={18} />}
            label="Footer Pages"
          />

          <TabButton
            active={tab === "favicon"}
            onClick={() => setTab("favicon")}
            icon={<ImageIcon size={18} />}
            label="Favicon"
          />
        </div>
      </div>

      {/* NAVBAR */}
      {tab === "navbar" && (
        <div className="space-y-6">

          <Section title="Navbar Visibility">
            <Toggle
              label="Enable Navbar"
              checked={settings.navbar_enabled}
              onChange={(v) => update("navbar_enabled", v)}
            />
          </Section>

          <Section title="Branding">
            <div className="grid md:grid-cols-2 gap-5">

              <Input
                label="Brand Name"
                value={settings.brand_name}
                onChange={(v) => update("brand_name", v)}
              />

              <Input
                label="Logo URL"
                value={settings.brand_logo_url}
                onChange={(v) => update("brand_logo_url", v)}
                placeholder="https://..."
              />

            </div>

            <div className="mt-5">
              <Toggle
                label="Show Brand Name"
                checked={settings.show_brand_name}
                onChange={(v) => update("show_brand_name", v)}
              />
            </div>

            {settings.brand_logo_url && (
              <div className="mt-5 p-5 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Logo Preview
                </p>

                <img
                  src={settings.brand_logo_url}
                  alt="Brand logo"
                  className="h-16 object-contain"
                />
              </div>
            )}
          </Section>

          <Section title="Navigation Links">
            <div className="space-y-3">

              {settings.nav_items.map((item, index) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-start gap-3">

                    <div className="pt-2 text-gray-400">
                      <GripVertical size={20} />
                    </div>

                    <div className="flex-1 grid md:grid-cols-2 gap-3">

                      <Input
                        label="Label"
                        value={item.label}
                        onChange={(v) =>
                          updateNavItem(index, "label", v)
                        }
                      />

                      <Input
                        label="URL / Path"
                        value={item.path}
                        onChange={(v) =>
                          updateNavItem(index, "path", v)
                        }
                      />

                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => moveNavItem(index, "up")}
                        disabled={index === 0}
                        className="px-2 py-1 rounded bg-white border hover:bg-gray-100 disabled:opacity-30"
                      >
                        ↑
                      </button>

                      <button
                        onClick={() => moveNavItem(index, "down")}
                        disabled={
                          index === settings.nav_items.length - 1
                        }
                        className="px-2 py-1 rounded bg-white border hover:bg-gray-100 disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>

                    <button
                      onClick={() => removeNavItem(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="mt-3 ml-8">
                    <Toggle
                      label="Visible"
                      checked={item.enabled}
                      onChange={(v) =>
                        updateNavItem(index, "enabled", v)
                      }
                    />
                  </div>
                </div>
              ))}

              <button
                onClick={addNavItem}
                className="flex items-center gap-2 px-4 py-3 border border-dashed border-gray-300 rounded-lg w-full justify-center hover:bg-gray-50"
              >
                <Plus size={18} />
                Add Navigation Link
              </button>

            </div>
          </Section>

          <Section title="Navbar Features">
            <div className="grid md:grid-cols-2 gap-4">

              <Toggle
                label="Search"
                checked={settings.show_search}
                onChange={(v) => update("show_search", v)}
              />

              <Toggle
                label="Wishlist"
                checked={settings.show_wishlist}
                onChange={(v) => update("show_wishlist", v)}
              />

              <Toggle
                label="Orders"
                checked={settings.show_orders}
                onChange={(v) => update("show_orders", v)}
              />

              <Toggle
                label="Cart"
                checked={settings.show_cart}
                onChange={(v) => update("show_cart", v)}
              />

              <Toggle
                label="Profile / Login"
                checked={settings.show_profile}
                onChange={(v) => update("show_profile", v)}
              />

            </div>
          </Section>

        </div>
      )}

      {/* FOOTER */}
      {tab === "footer" && (
        <div className="space-y-6">

          <Section title="Footer Visibility">
            <Toggle
              label="Enable Footer"
              checked={settings.footer_enabled}
              onChange={(v) => update("footer_enabled", v)}
            />
          </Section>

          <Section title="Footer Content">

            <TextArea
              label="Footer Description"
              value={settings.footer_description}
              onChange={(v) =>
                update("footer_description", v)
              }
              rows={4}
            />

            <div className="grid md:grid-cols-2 gap-5 mt-5">

              <Input
                label="Address"
                value={settings.footer_address}
                onChange={(v) =>
                  update("footer_address", v)
                }
              />

              <Input
                label="Phone"
                value={settings.footer_phone}
                onChange={(v) =>
                  update("footer_phone", v)
                }
              />

              <Input
                label="Email"
                value={settings.footer_email}
                onChange={(v) =>
                  update("footer_email", v)
                }
              />

              <Input
                label="Copyright Text"
                value={settings.footer_copyright}
                onChange={(v) =>
                  update("footer_copyright", v)
                }
              />

            </div>

          </Section>
                <FooterLinksEditor
  title="Quick Links"
  links={settings.footer_quick_links}
  onChange={(links) =>
    update("footer_quick_links", links)
  }
/>

<FooterLinksEditor
  title="Customer Service"
  links={settings.footer_service_links}
  onChange={(links) =>
    update("footer_service_links", links)
  }
/>
          <Section title="Social Media">

            <div className="grid md:grid-cols-2 gap-5">

              <Input
                label="Facebook URL"
                value={settings.facebook_url}
                onChange={(v) =>
                  update("facebook_url", v)
                }
              />

              <Input
                label="Instagram URL"
                value={settings.instagram_url}
                onChange={(v) =>
                  update("instagram_url", v)
                }
              />

              <Input
                label="Twitter / X URL"
                value={settings.twitter_url}
                onChange={(v) =>
                  update("twitter_url", v)
                }
              />

              <Input
                label="YouTube URL"
                value={settings.youtube_url}
                onChange={(v) =>
                  update("youtube_url", v)
                }
              />

            </div>

          </Section>

          <Section title="Developer Information">

            <div className="grid md:grid-cols-2 gap-5">

              <Input
                label="Developer Text"
                value={settings.footer_developer_text}
                onChange={(v) =>
                  update("footer_developer_text", v)
                }
              />

              <Input
                label="Developer URL"
                value={settings.footer_developer_url}
                onChange={(v) =>
                  update("footer_developer_url", v)
                }
              />

            </div>

          </Section>

        </div>
      )}

      {/* FOOTER PAGES */}
      {tab === "footer-pages" && (
        <FooterPagesEditor
          pages={settings.footer_pages}
          onChange={(pages) => update("footer_pages", pages)}
        />
      )}

      {/* FAVICON */}
      {tab === "favicon" && (
        <Section title="Website Favicon">

          <Input
            label="Favicon URL"
            value={settings.favicon_url}
            onChange={(v) => update("favicon_url", v)}
            placeholder="https://..."
          />

          {settings.favicon_url && (
            <div className="mt-6 flex items-center gap-4">
              <img
                src={settings.favicon_url}
                alt="Favicon"
                className="w-16 h-16 object-contain border rounded-lg p-2"
              />

              <div>
                <p className="font-medium text-gray-900">
                  Current Favicon
                </p>

                <p className="text-sm text-gray-500">
                  This will be used as the browser tab icon.
                </p>
              </div>
            </div>
          )}

        </Section>
      )}


      {/* BOTTOM ACTIONS */}
      <div className="mt-8 bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3">

          <button
            onClick={resetSettings}
            disabled={saving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RotateCcw size={18} />
            Reset
          </button>

          <button
            onClick={saveSettings}
            disabled={saving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Changes"}
          </button>

        </div>
      </div>

    </div>
  );
}
function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap ${
        active
          ? "text-primary-600 border-b-2 border-primary-600"
          : "text-gray-600 hover:text-gray-900"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-5">
        {title}
      </h2>

      {children}
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </span>

      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </span>

      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
      />
    </label>
  );
}
function FooterPagesEditor({
  pages,
  onChange,
}: {
  pages: Record<string, FooterPage>;
  onChange: (pages: Record<string, FooterPage>) => void;
}) {
  const [selectedPage, setSelectedPage] = useState("faq");
  const pageNames: Record<string, string> = { faq: "FAQs", shipping: "Shipping Policy", returns: "Returns & Refunds", terms: "Terms & Conditions", privacy: "Privacy Policy" };
  const page = pages[selectedPage];
  if (!page) return null;

  const updatePage = (field: keyof FooterPage, value: string | FooterPageSection[]) => {
    onChange({ ...pages, [selectedPage]: { ...page, [field]: value } });
  };
  const updateSection = (index: number, field: keyof FooterPageSection, value: string) => {
    const sections = [...page.sections];
    sections[index] = { ...sections[index], [field]: value };
    updatePage("sections", sections);
  };
  const addSection = () => updatePage("sections", [...page.sections, { id: crypto.randomUUID(), heading: "New Section", content: "" }]);
  const removeSection = (index: number) => updatePage("sections", page.sections.filter((_, i) => i !== index));
  const moveSection = (index: number, direction: "up" | "down") => {
    const sections = [...page.sections];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= sections.length) return;
    [sections[index], sections[target]] = [sections[target], sections[index]];
    updatePage("sections", sections);
  };

  return (
    <div className="space-y-6">
      <Section title="Footer Page">
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-2">Select Page</span>
          <select value={selectedPage} onChange={(e) => setSelectedPage(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
            {Object.entries(pageNames).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
          </select>
        </label>
      </Section>

      <Section title="Page Information">
        <div className="space-y-5">
          <Input label="Page Title" value={page.title} onChange={(value) => updatePage("title", value)} />
          <TextArea label="Intro / Description" value={page.intro} onChange={(value) => updatePage("intro", value)} rows={4} />
        </div>
      </Section>

      <Section title="Page Sections">
        <div className="space-y-4">
          {page.sections.map((section, index) => (
            <div key={section.id} className="border border-gray-200 rounded-xl p-5 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h3 className="font-semibold text-gray-900">Section {index + 1}</h3>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => moveSection(index, "up")} disabled={index === 0} className="px-2.5 py-1.5 rounded bg-white border hover:bg-gray-100 disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => moveSection(index, "down")} disabled={index === page.sections.length - 1} className="px-2.5 py-1.5 rounded bg-white border hover:bg-gray-100 disabled:opacity-30">↓</button>
                  <button type="button" onClick={() => removeSection(index)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                </div>
              </div>
              <div className="space-y-4">
                <Input label="Section Heading" value={section.heading} onChange={(value) => updateSection(index, "heading", value)} />
                <TextArea label="Section Content" value={section.content} onChange={(value) => updateSection(index, "content", value)} rows={8} />
              </div>
            </div>
          ))}
          <button type="button" onClick={addSection} className="w-full border border-dashed border-gray-300 rounded-lg py-4 flex items-center justify-center gap-2 hover:bg-gray-50"><Plus size={18} /> Add Section</button>
        </div>
      </Section>
    </div>
  );
}

function FooterLinksEditor({
  title,
  links,
  onChange,
}: {
  title: string;
  links: FooterLink[];
  onChange: (links: FooterLink[]) => void;
}) {
  function updateLink(
    index: number,
    field: keyof FooterLink,
    value: string | boolean
  ) {
    const updated = [...links];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    onChange(updated);
  }

  function addLink() {
    onChange([
      ...links,
      {
        id: crypto.randomUUID(),
        label: "New Link",
        path: "/",
        enabled: true,
      },
    ]);
  }

  function removeLink(index: number) {
    onChange(links.filter((_, i) => i !== index));
  }

  function moveLink(
    index: number,
    direction: "up" | "down"
  ) {
    const updated = [...links];

    const target =
      direction === "up"
        ? index - 1
        : index + 1;

    if (
      target < 0 ||
      target >= updated.length
    ) {
      return;
    }

    [updated[index], updated[target]] = [
      updated[target],
      updated[index],
    ];

    onChange(updated);
  }

  return (
    <Section title={title}>
      <div className="space-y-3">

        {links.map((link, index) => (
          <div
            key={link.id}
            className="border border-gray-200 rounded-lg p-4 bg-gray-50"
          >
            <div className="flex items-start gap-3">

              <div className="pt-2 text-gray-400">
                <GripVertical size={20} />
              </div>

              <div className="flex-1 grid md:grid-cols-2 gap-3">

                <Input
                  label="Link Name"
                  value={link.label}
                  onChange={(value) =>
                    updateLink(
                      index,
                      "label",
                      value
                    )
                  }
                />

                <Input
                  label="URL / Path"
                  value={link.path}
                  onChange={(value) =>
                    updateLink(
                      index,
                      "path",
                      value
                    )
                  }
                />

              </div>

              <div className="flex flex-col gap-2">

                <button
                  type="button"
                  onClick={() =>
                    moveLink(index, "up")
                  }
                  disabled={index === 0}
                  className="px-2 py-1 rounded bg-white border hover:bg-gray-100 disabled:opacity-30"
                >
                  ↑
                </button>

                <button
                  type="button"
                  onClick={() =>
                    moveLink(index, "down")
                  }
                  disabled={
                    index === links.length - 1
                  }
                  className="px-2 py-1 rounded bg-white border hover:bg-gray-100 disabled:opacity-30"
                >
                  ↓
                </button>

              </div>

              <button
                type="button"
                onClick={() =>
                  removeLink(index)
                }
                className="p-2 text-red-500 hover:bg-red-50 rounded"
              >
                <Trash2 size={18} />
              </button>

            </div>

            <div className="mt-3 ml-8">
              <Toggle
                label="Visible"
                checked={link.enabled}
                onChange={(value) =>
                  updateLink(
                    index,
                    "enabled",
                    value
                  )
                }
              />
            </div>

          </div>
        ))}

        <button
          type="button"
          onClick={addLink}
          className="flex items-center gap-2 px-4 py-3 border border-dashed border-gray-300 rounded-lg w-full justify-center hover:bg-gray-50"
        >
          <Plus size={18} />
          Add Link
        </button>

      </div>
    </Section>
  );
}
function Toggle({
  
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer">
      <span className="text-sm font-medium text-gray-700">
        {label}
      </span>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition ${
          checked ? "bg-primary-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </label>
  );
}