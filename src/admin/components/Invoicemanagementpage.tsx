import { useEffect, useState } from "react";
import {
  Save,
  AlertCircle,
  Check,
  Loader2,
  Eye,
  Upload,
  X,
} from "lucide-react";
import { supabaseAdmin as supabase } from "../../lib/supabaseAdmin";

interface InvoiceSettings {
  id?: string;
  store_name: string;
  store_logo_url: string;
  registered_address: string;
  ship_from_address: string;
  phone: string;
  email: string;
  website: string;
  gstin: string;
  pan: string;
  cin: string;
  state: string;
  state_code: string;
  place_of_supply: string;
  invoice_prefix: string;
  invoice_numbering_format: string;
  invoice_starting_number: number;
  invoice_current_number: number;
  financial_year_format: string;
  gst_enabled: boolean;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  cess_rate: number;
  tax_inclusive_pricing: boolean;
  shipping_charge_label: string;
  platform_fee_label: string;
  handling_charge_label: string;
  other_charge_label: string;
  show_logo: boolean;
  show_gstin: boolean;
  show_pan: boolean;
  show_hsn_sac: boolean;
  show_sku: boolean;
  show_payment_info: boolean;
  show_amount_in_words: boolean;
  show_declaration: boolean;
  show_signature: boolean;
  footer_text: string;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_SETTINGS: InvoiceSettings = {
  store_name: "UrbanSpoonery",
  store_logo_url: "",
  registered_address: "",
  ship_from_address: "",
  phone: "",
  email: "",
  website: "",
  gstin: "",
  pan: "",
  cin: "",
  state: "Assam",
  state_code: "AS",
  place_of_supply: "Assam",
  invoice_prefix: "US/INV/",
  invoice_numbering_format: "{YEAR}/{NUMBER}",
  invoice_starting_number: 1,
  invoice_current_number: 1,
  financial_year_format: "YYYY",
  gst_enabled: true,
  cgst_rate: 9,
  sgst_rate: 9,
  igst_rate: 18,
  cess_rate: 0,
  tax_inclusive_pricing: false,
  shipping_charge_label: "Shipping Charges",
  platform_fee_label: "Platform Fee",
  handling_charge_label: "Handling Charge",
  other_charge_label: "Other Charges",
  show_logo: true,
  show_gstin: true,
  show_pan: true,
  show_hsn_sac: false,
  show_sku: false,
  show_payment_info: true,
  show_amount_in_words: true,
  show_declaration: true,
  show_signature: true,
  footer_text:
    "Thank you for your business!",
};

export function InvoiceManagementPage() {
  const [settings, setSettings] = useState<InvoiceSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("store");
  const [showPreview, setShowPreview] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .single();

      if (!error && data) {
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (err) {
      console.error("Error loading settings:", err);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const { data, error } = await supabase
        .from("settings")
        .upsert([settings], { onConflict: "id" })
        .select();

      if (error) throw error;

      setMessage({ type: "success", text: "Invoice settings saved successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setMessage({ type: "error", text: "Failed to save settings. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload() {
    if (!logoFile) return;

    setUploadingLogo(true);
    try {
      const fileName = `invoice-logo-${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from("store-assets")
        .upload(fileName, logoFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("store-assets")
        .getPublicUrl(fileName);

      setSettings({ ...settings, store_logo_url: data.publicUrl });
      setLogoFile(null);
      setMessage({ type: "success", text: "Logo uploaded successfully!" });
    } catch (err) {
      console.error("Error uploading logo:", err);
      setMessage({ type: "error", text: "Failed to upload logo" });
    } finally {
      setUploadingLogo(false);
    }
  }

  function handleInputChange(field: keyof InvoiceSettings, value: any) {
    setSettings({ ...settings, [field]: value });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
        <p className="text-gray-600 mt-1">Configure invoice settings and appearance</p>
      </div>

      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <Check size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          {message.text}
        </div>
      )}

      <div className="flex gap-8">
        {/* Tabs */}
        <div className="w-48">
          <div className="space-y-2">
            {[
              { id: "store", label: "Store Information", icon: "🏪" },
              { id: "invoice", label: "Invoice Numbers", icon: "#️⃣" },
              { id: "tax", label: "Tax Settings", icon: "📊" },
              { id: "charges", label: "Shipping & Fees", icon: "🚚" },
              { id: "appearance", label: "Appearance", icon: "🎨" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Store Information */}
            {activeTab === "store" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Store Information
                </h2>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Store Name
                  </label>
                  <input
                    type="text"
                    value={settings.store_name}
                    onChange={(e) =>
                      handleInputChange("store_name", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Store Logo
                  </label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      {settings.store_logo_url && (
                        <div className="mb-4 relative">
                          <img
                            src={settings.store_logo_url}
                            alt="Store Logo"
                            className="h-20 object-contain"
                          />
                          <button
                            onClick={() =>
                              handleInputChange("store_logo_url", "")
                            }
                            className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer"
                      />
                    </div>
                    {logoFile && (
                      <button
                        onClick={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        <Upload size={16} /> Upload
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Registered Address
                  </label>
                  <textarea
                    value={settings.registered_address}
                    onChange={(e) =>
                      handleInputChange("registered_address", e.target.value)
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ship-from Address
                  </label>
                  <textarea
                    value={settings.ship_from_address}
                    onChange={(e) =>
                      handleInputChange("ship_from_address", e.target.value)
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={settings.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={settings.website}
                    onChange={(e) =>
                      handleInputChange("website", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      GSTIN
                    </label>
                    <input
                      type="text"
                      value={settings.gstin}
                      onChange={(e) =>
                        handleInputChange("gstin", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      PAN
                    </label>
                    <input
                      type="text"
                      value={settings.pan}
                      onChange={(e) =>
                        handleInputChange("pan", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={settings.state}
                      onChange={(e) =>
                        handleInputChange("state", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      State Code
                    </label>
                    <input
                      type="text"
                      value={settings.state_code}
                      onChange={(e) =>
                        handleInputChange("state_code", e.target.value)
                      }
                      maxLength={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Invoice Numbers */}
            {activeTab === "invoice" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Invoice Number Settings
                </h2>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>Next Invoice Number:</strong>{" "}
                    {settings.invoice_prefix}
                    {settings.invoice_current_number}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Invoice Prefix (e.g., US/INV/)
                  </label>
                  <input
                    type="text"
                    value={settings.invoice_prefix}
                    onChange={(e) =>
                      handleInputChange("invoice_prefix", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This prefix appears at the beginning of every invoice number
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Numbering Format
                  </label>
                  <input
                    type="text"
                    value={settings.invoice_numbering_format}
                    onChange={(e) =>
                      handleInputChange(
                        "invoice_numbering_format",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use &#123;YEAR&#125; and &#123;NUMBER&#125; as placeholders
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Starting Number
                    </label>
                    <input
                      type="number"
                      value={settings.invoice_starting_number}
                      onChange={(e) =>
                        handleInputChange(
                          "invoice_starting_number",
                          parseInt(e.target.value)
                        )
                      }
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Current Number
                    </label>
                    <input
                      type="number"
                      value={settings.invoice_current_number}
                      onChange={(e) =>
                        handleInputChange(
                          "invoice_current_number",
                          parseInt(e.target.value)
                        )
                      }
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Financial Year Format
                  </label>
                  <select
                    value={settings.financial_year_format}
                    onChange={(e) =>
                      handleInputChange("financial_year_format", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="YYYY">Calendar Year (2026)</option>
                    <option value="FY">Financial Year (FY 2025-26)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Tax Settings */}
            {activeTab === "tax" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Tax Settings
                </h2>

                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    id="gst_enabled"
                    checked={settings.gst_enabled}
                    onChange={(e) =>
                      handleInputChange("gst_enabled", e.target.checked)
                    }
                    className="w-4 h-4"
                  />
                  <label
                    htmlFor="gst_enabled"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Enable GST
                  </label>
                </div>

                {settings.gst_enabled && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          CGST Rate (%)
                        </label>
                        <input
                          type="number"
                          value={settings.cgst_rate}
                          onChange={(e) =>
                            handleInputChange(
                              "cgst_rate",
                              parseFloat(e.target.value)
                            )
                          }
                          step="0.01"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          SGST Rate (%)
                        </label>
                        <input
                          type="number"
                          value={settings.sgst_rate}
                          onChange={(e) =>
                            handleInputChange(
                              "sgst_rate",
                              parseFloat(e.target.value)
                            )
                          }
                          step="0.01"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          IGST Rate (%)
                        </label>
                        <input
                          type="number"
                          value={settings.igst_rate}
                          onChange={(e) =>
                            handleInputChange(
                              "igst_rate",
                              parseFloat(e.target.value)
                            )
                          }
                          step="0.01"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          CESS Rate (%)
                        </label>
                        <input
                          type="number"
                          value={settings.cess_rate}
                          onChange={(e) =>
                            handleInputChange(
                              "cess_rate",
                              parseFloat(e.target.value)
                            )
                          }
                          step="0.01"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        id="tax_inclusive"
                        checked={settings.tax_inclusive_pricing}
                        onChange={(e) =>
                          handleInputChange(
                            "tax_inclusive_pricing",
                            e.target.checked
                          )
                        }
                        className="w-4 h-4"
                      />
                      <label
                        htmlFor="tax_inclusive"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Tax-Inclusive Pricing
                      </label>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Shipping & Other Charges */}
            {activeTab === "charges" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Shipping & Other Charges
                </h2>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Shipping Charge Label
                  </label>
                  <input
                    type="text"
                    value={settings.shipping_charge_label}
                    onChange={(e) =>
                      handleInputChange("shipping_charge_label", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Platform Fee Label
                  </label>
                  <input
                    type="text"
                    value={settings.platform_fee_label}
                    onChange={(e) =>
                      handleInputChange("platform_fee_label", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Handling Charge Label
                  </label>
                  <input
                    type="text"
                    value={settings.handling_charge_label}
                    onChange={(e) =>
                      handleInputChange("handling_charge_label", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Other Charges Label
                  </label>
                  <input
                    type="text"
                    value={settings.other_charge_label}
                    onChange={(e) =>
                      handleInputChange("other_charge_label", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Appearance */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Invoice Appearance
                </h2>

                <div className="space-y-4">
                  {[
                    { key: "show_logo", label: "Show Logo" },
                    { key: "show_gstin", label: "Show GSTIN" },
                    { key: "show_pan", label: "Show PAN" },
                    { key: "show_hsn_sac", label: "Show HSN/SAC" },
                    { key: "show_sku", label: "Show SKU" },
                    { key: "show_payment_info", label: "Show Payment Information" },
                    { key: "show_amount_in_words", label: "Show Amount in Words" },
                    { key: "show_declaration", label: "Show Declaration" },
                    { key: "show_signature", label: "Show Signature" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        id={item.key}
                        checked={settings[item.key as keyof InvoiceSettings] as boolean}
                        onChange={(e) =>
                          handleInputChange(
                            item.key as keyof InvoiceSettings,
                            e.target.checked
                          )
                        }
                        className="w-4 h-4"
                      />
                      <label htmlFor={item.key} className="text-sm font-semibold text-gray-700">
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Footer Text
                  </label>
                  <textarea
                    value={settings.footer_text}
                    onChange={(e) =>
                      handleInputChange("footer_text", e.target.value)
                    }
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4 justify-end">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
        >
          <Eye size={20} /> Preview Invoice
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
        >
          <Save size={20} /> {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-96 overflow-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Invoice Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 rounded p-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold">{settings.store_name}</h2>
                  <p className="text-gray-600">TAX INVOICE</p>
                </div>
                <div className="grid grid-cols-2 gap-8 text-sm">
                  <div>
                    <h4 className="font-bold mb-2">Invoice Information</h4>
                    <p>Invoice: Sample/2026/000001</p>
                    <p>Order: #ORD-2026-001</p>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Seller Information</h4>
                    <p>{settings.store_name}</p>
                    <p>{settings.registered_address}</p>
                    {settings.gstin && <p>GSTIN: {settings.gstin}</p>}
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-6">
                  This is a preview of how invoices will appear with your current settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}