import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../contexts/CustomerAuthContext";
import { Download, Printer, ArrowLeft, Loader2 } from "lucide-react";

interface InvoiceData {
  order: any;
  items: any[];
  settings: any;
  invoiceNumber: string;
}

export function InvoicePage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!user || !orderNumber) {
      setLoading(false);
      setError("Order not found");
      return;
    }

    loadInvoice();
  }, [user?.id, orderNumber]);

  async function loadInvoice() {
    try {
      // Fetch order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user!.id)
        .eq("order_number", orderNumber)
        .single();

      if (orderError || !order) {
        setError("Order not found or you don't have access to it");
        setLoading(false);
        return;
      }

      // Fetch order items
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);

      if (itemsError) throw itemsError;

      // Fetch settings
      const { data: settings } = await supabase
        .from("settings")
        .select("*")
        .single();

      // For now, use a stable invoice number format
      // In production, this would come from the database
      const invoiceNumber = `US/INV/${new Date(order.created_at).getFullYear()}/${String(order.id.charCodeAt(0) + order.id.length).padStart(6, "0")}`;

      setInvoiceData({
        order,
        items: items || [],
        settings: settings || {},
        invoiceNumber,
      });
    } catch (err) {
      console.error("Error loading invoice:", err);
      setError("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 100);
  }

  function handleDownloadPDF() {
    if (!invoiceData) return;

    try {
      const element = document.getElementById("invoice-content");
      if (!element) return;

      // Use html2pdf library if available, otherwise fallback to print
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      printWindow.document.write(element.outerHTML);
      printWindow.document.close();
      printWindow.print();
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Error generating PDF. Please try using Print instead.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-10">
        <div className="max-w-5xl mx-auto px-4">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-800 mb-6 flex items-center gap-2"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!invoiceData) return null;

  const { order, items, settings, invoiceNumber } = invoiceData;
  const storeLogoUrl = settings?.store_logo_url || null;

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const shippingCost = order.shipping_cost || 0;
  const discount = subtotal - (order.subtotal || subtotal);
  const gstRate = 0.18; // 18% default GST
  const taxableAmount = order.subtotal || subtotal;
  const cgst = taxableAmount * (gstRate / 2);
  const sgst = taxableAmount * (gstRate / 2);
  const grandTotal = order.total;

  // Convert number to words (basic implementation)
  function numberToWords(num: number): string {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];
    const scales = [
      "",
      "Thousand",
      "Lakh",
      "Crore",
    ];

    if (num === 0) return "Zero";

    function convert(n: number, scale: number): string {
      if (n === 0) return "";
      let result = "";

      // Handle hundreds
      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + " Hundred ";
        n %= 100;
      }

      // Handle tens and ones
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + " ";
        if (n % 10 > 0) {
          result += ones[n % 10] + " ";
        }
      } else if (n >= 10) {
        result += teens[n - 10] + " ";
      } else if (n > 0) {
        result += ones[n] + " ";
      }

      if (scale > 0) {
        result += scales[scale] + " ";
      }

      return result;
    }

    let words = "";
    let scaleIndex = 0;

    while (num > 0 && scaleIndex < scales.length) {
      if (scaleIndex === 0) {
        words = convert(num % 100, 0) + words;
        num = Math.floor(num / 100);
      } else if (scaleIndex === 1) {
        words = convert(num % 100, 1) + words;
        num = Math.floor(num / 100);
      } else {
        words = convert(num % 100, scaleIndex) + words;
        num = Math.floor(num / 100);
      }
      scaleIndex++;
    }

    return words.trim() + " Only";
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <div className="max-w-5xl mx-auto">
        {/* Header Actions - Hide on Print */}
        <div className="print:hidden mb-6 px-4">
          <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-6">
            <button
              onClick={() => navigate(-1)}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
            >
              <ArrowLeft size={20} /> Back to Order
            </button>
            <div className="flex gap-4">
              <button
                onClick={handlePrint}
                disabled={printing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Printer size={20} /> Print Invoice
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download size={20} /> Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* Invoice */}
        <div
          id="invoice-content"
          className="bg-white rounded-lg shadow-lg print:shadow-none print:rounded-none mx-4 print:mx-0"
        >
          <div className="p-12 print:p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 pb-8 border-b-2 border-gray-300">
              <div>
                {storeLogoUrl && (
                  <img
                    src={storeLogoUrl}
                    alt="Store Logo"
                    className="h-16 mb-4"
                  />
                )}
                <h1 className="text-3xl font-bold text-gray-900">
                  {settings?.store_name || "UrbanSpoonery"}
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  {settings?.address || ""}
                </p>
                {settings?.gstin && (
                  <p className="text-gray-600 text-sm">
                    GSTIN: {settings.gstin}
                  </p>
                )}
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-blue-600 mb-4">
                  TAX INVOICE
                </h2>
                <p className="text-gray-600 text-sm">E. & O.E.</p>
                <p className="text-gray-600 text-sm">
                  Page 1 of 1
                </p>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Order Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice Number:</span>
                    <span className="font-semibold text-gray-900">
                      {invoiceNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-semibold text-gray-900">
                      {order.order_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice Date:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(order.created_at).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(order.created_at).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-semibold text-gray-900">
                      {order.payment_method || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <h3 className="font-bold text-gray-900 mb-4 text-left">
                  Billing Address
                </h3>
                <div className="text-sm text-gray-700 text-left">
                  <p className="font-semibold">{order.customer_name}</p>
                  <p>{order.shipping_address}</p>
                  <p>
                    {order.shipping_city}, {order.shipping_state}{" "}
                    {order.shipping_pincode}
                  </p>
                  <p>{order.customer_phone}</p>
                  <p>{order.customer_email}</p>
                </div>
              </div>
            </div>

            {/* Seller Information */}
            <div className="mb-8 p-4 bg-gray-50 rounded border border-gray-300">
              <h3 className="font-bold text-gray-900 mb-2">
                Seller Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <p className="font-semibold">Sold By</p>
                  <p>{settings?.store_name || "UrbanSpoonery"}</p>
                </div>
                <div>
                  <p className="font-semibold">Ship From Address</p>
                  <p>{settings?.address || ""}</p>
                </div>
                {settings?.gstin && (
                  <div>
                    <p className="font-semibold">GSTIN</p>
                    <p>{settings.gstin}</p>
                  </div>
                )}
                {settings?.pan && (
                  <div>
                    <p className="font-semibold">PAN</p>
                    <p>{settings.pan}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8 overflow-x-auto">
              <table className="w-full border-collapse border border-gray-400">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-gray-400 px-4 py-2 text-left text-xs font-bold">
                      Description
                    </th>
                    <th className="border border-gray-400 px-4 py-2 text-right text-xs font-bold">
                      Qty
                    </th>
                    <th className="border border-gray-400 px-4 py-2 text-right text-xs font-bold">
                      Price
                    </th>
                    <th className="border border-gray-400 px-4 py-2 text-right text-xs font-bold">
                      Amount
                    </th>
                    <th className="border border-gray-400 px-4 py-2 text-right text-xs font-bold">
                      CGST (9%)
                    </th>
                    <th className="border border-gray-400 px-4 py-2 text-right text-xs font-bold">
                      SGST (9%)
                    </th>
                    <th className="border border-gray-400 px-4 py-2 text-right text-xs font-bold">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const itemCgst = (item.total * 0.09);
                    const itemSgst = (item.total * 0.09);
                    return (
                      <tr key={idx}>
                        <td className="border border-gray-400 px-4 py-3 text-sm">
                          {item.product_name}
                        </td>
                        <td className="border border-gray-400 px-4 py-3 text-sm text-right">
                          {item.quantity}
                        </td>
                        <td className="border border-gray-400 px-4 py-3 text-sm text-right">
                          ₹{(item.price).toFixed(2)}
                        </td>
                        <td className="border border-gray-400 px-4 py-3 text-sm text-right">
                          ₹{(item.total - itemCgst - itemSgst).toFixed(2)}
                        </td>
                        <td className="border border-gray-400 px-4 py-3 text-sm text-right">
                          ₹{itemCgst.toFixed(2)}
                        </td>
                        <td className="border border-gray-400 px-4 py-3 text-sm text-right">
                          ₹{itemSgst.toFixed(2)}
                        </td>
                        <td className="border border-gray-400 px-4 py-3 text-sm text-right font-semibold">
                          ₹{item.total.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mb-8 flex justify-end">
              <div className="w-full sm:w-96">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="py-2 text-gray-600">Subtotal</td>
                      <td className="py-2 text-right font-semibold">
                        ₹{subtotal.toFixed(2)}
                      </td>
                    </tr>
                    {shippingCost > 0 && (
                      <tr className="border-b border-gray-300">
                        <td className="py-2 text-gray-600">Shipping</td>
                        <td className="py-2 text-right font-semibold">
                          ₹{shippingCost.toFixed(2)}
                        </td>
                      </tr>
                    )}
                    <tr className="border-b border-gray-300">
                      <td className="py-2 text-gray-600">CGST (9%)</td>
                      <td className="py-2 text-right font-semibold">
                        ₹{cgst.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-2 text-gray-600">SGST (9%)</td>
                      <td className="py-2 text-right font-semibold">
                        ₹{sgst.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="bg-blue-50">
                      <td className="py-3 text-lg font-bold text-gray-900">
                        Grand Total
                      </td>
                      <td className="py-3 text-right text-lg font-bold text-blue-600">
                        ₹{grandTotal.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Amount in Words */}
            <div className="mb-8 p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Amount in Words:</span>{" "}
                {numberToWords(Math.round(grandTotal))}
              </p>
            </div>

            {/* Payment Information */}
            <div className="mb-8 p-4 bg-gray-50 rounded">
              <h3 className="font-bold text-gray-900 mb-2">
                Payment Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Payment Method:</span>
                  <p className="font-semibold text-gray-900">
                    {order.payment_method || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Payment Status:</span>
                  <p
                    className={`font-semibold ${
                      order.payment_status === "Paid"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {order.payment_status || "Pending"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Amount Paid:</span>
                  <p className="font-semibold text-gray-900">
                    ₹{grandTotal.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Amount Due:</span>
                  <p className="font-semibold text-gray-900">
                    ₹{order.payment_status === "Paid" ? "0.00" : "0.00"}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-8 border-t-2 border-gray-300">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-xs text-gray-600 mb-4">
                    <strong>Declaration:</strong> We hereby declare that the
                    above information is correct and complete. This is a computer
                    generated invoice.
                  </p>
                </div>
                <div className="text-right">
                  <div className="h-16 mb-2 border-t border-gray-400 mt-8"></div>
                  <p className="text-xs font-semibold text-gray-900">
                    Authorized Signatory
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-300">
                <div className="text-center text-xs text-gray-600">
                  <p className="font-semibold mb-2">
                    {settings?.store_name || "UrbanSpoonery"}
                  </p>
                  <p>E. & O.E.</p>
                  {settings?.phone_1 && (
                    <p>Phone: {settings.phone_1}</p>
                  )}
                  {settings?.store_email && (
                    <p>Email: {settings.store_email}</p>
                  )}
                  {settings?.store_website && (
                    <p>Website: {settings.store_website}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:py-0 {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
          .print\\:mx-0 {
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          .print\\:p-8 {
            padding: 2rem !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}