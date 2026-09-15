export function generateInvoice(order: any, items: any[] = []) {
  if (!order) {
    console.error("Cannot generate invoice: order is missing");
    return;
  }

  const invoiceNumber =
    order.invoice_number ||
    `US/INV/${new Date(order.created_at).getFullYear()}/${String(
      order.id || order.order_number
    )
      .replace(/\D/g, "")
      .slice(-6)
      .padStart(6, "0")}`;

  const money = (value: any) =>
    `₹${Number(value || 0).toFixed(2)}`;

  const escapeHtml = (value: any) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "-";

  const itemRows = items
    .map(
      (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>
            <strong>${escapeHtml(item.product_name || "Product")}</strong>
            ${
              item.sku
                ? `<div class="small">SKU: ${escapeHtml(item.sku)}</div>`
                : ""
            }
          </td>
          <td class="right">${Number(item.quantity || 0)}</td>
          <td class="right">${money(item.price)}</td>
          <td class="right">${money(item.total)}</td>
        </tr>
      `
    )
    .join("");

  const subtotal = Number(order.subtotal || 0);
  const shipping = Number(order.shipping_cost || 0);
  const total = Number(order.total || subtotal + shipping);

  const customerAddress = [
    order.shipping_address,
    order.shipping_city,
    order.shipping_state,
    order.shipping_pincode,
  ]
    .filter(Boolean)
    .map(escapeHtml)
    .join("<br>");

  const invoiceHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${escapeHtml(invoiceNumber)}</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 30px;
      background: #f3f4f6;
      color: #111827;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 13px;
    }

    .invoice {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 18mm;
      background: white;
    }

    .top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #111827;
      padding-bottom: 18px;
      margin-bottom: 20px;
    }

    .brand h1 {
      margin: 0 0 6px;
      font-size: 26px;
    }

    .brand p,
    .invoice-meta p {
      margin: 3px 0;
      color: #4b5563;
    }

    .invoice-title {
      text-align: right;
    }

    .invoice-title h2 {
      margin: 0 0 8px;
      font-size: 24px;
    }

    .eoe {
      font-size: 11px;
      color: #6b7280;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 35px;
      margin-bottom: 24px;
    }

    .section-title {
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 8px;
      border-bottom: 1px solid #d1d5db;
      padding-bottom: 5px;
    }

    .box {
      border: 1px solid #d1d5db;
      padding: 12px;
    }

    .box p {
      margin: 4px 0;
      line-height: 1.45;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }

    th {
      background: #f3f4f6;
      font-weight: bold;
    }

    th,
    td {
      border: 1px solid #9ca3af;
      padding: 9px;
      vertical-align: top;
    }

    .right {
      text-align: right;
    }

    .small {
      font-size: 10px;
      color: #6b7280;
      margin-top: 3px;
    }

    .totals {
      width: 330px;
      margin-left: auto;
      margin-top: 20px;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 7px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .grand-total {
      font-size: 17px;
      font-weight: bold;
      border-top: 2px solid #111827;
      border-bottom: 2px solid #111827;
      padding: 11px 0;
      margin-top: 5px;
    }

    .footer {
      margin-top: 50px;
      padding-top: 15px;
      border-top: 1px solid #9ca3af;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }

    .signature {
      text-align: right;
      padding-top: 40px;
    }

    .signature-line {
      border-top: 1px solid #6b7280;
      width: 180px;
      margin-left: auto;
      padding-top: 6px;
    }

    .muted {
      color: #6b7280;
      font-size: 11px;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }

      .invoice {
        width: 210mm;
        min-height: 297mm;
        margin: 0;
        padding: 15mm;
      }

      @page {
        size: A4;
        margin: 0;
      }
    }
  </style>
</head>

<body>
  <div class="invoice">

    <div class="top">
      <div class="brand">
        <h1>UrbanSpoonery</h1>
        <p>Kitchen Tools &amp; Essentials</p>
        <p>India</p>
      </div>

      <div class="invoice-title">
        <h2>Tax Invoice</h2>
        <p class="eoe">E. &amp; O.E.</p>
        <p class="eoe">Page 1 of 1</p>
      </div>
    </div>

    <div class="info-grid">

      <div class="box">
        <div class="section-title">Invoice Details</div>

        <p>
          <strong>Invoice Number:</strong>
          ${escapeHtml(invoiceNumber)}
        </p>

        <p>
          <strong>Order ID:</strong>
          ${escapeHtml(order.order_number || order.id)}
        </p>

        <p>
          <strong>Order Date:</strong>
          ${orderDate}
        </p>

        <p>
          <strong>Invoice Date:</strong>
          ${orderDate}
        </p>

        <p>
          <strong>Payment Method:</strong>
          ${escapeHtml(order.payment_method || "N/A")}
        </p>

        <p>
          <strong>Payment Status:</strong>
          ${escapeHtml(order.payment_status || "Pending")}
        </p>
      </div>

      <div class="box">
        <div class="section-title">Billing / Shipping Address</div>

        <p>
          <strong>${escapeHtml(order.customer_name || "Customer")}</strong>
        </p>

        <p>${customerAddress || "Address not available"}</p>

        ${
          order.customer_phone
            ? `<p>Phone: ${escapeHtml(order.customer_phone)}</p>`
            : ""
        }

        ${
          order.customer_email
            ? `<p>Email: ${escapeHtml(order.customer_email)}</p>`
            : ""
        }
      </div>

    </div>

    <div class="box">
      <div class="section-title">Sold By</div>

      <p>
        <strong>UrbanSpoonery</strong>
      </p>

      <p>Kitchen Tools &amp; Essentials</p>

      <p>
        Registered Office / Ship-from Address:
        India
      </p>

      <p>
        GSTIN:
        Not configured
      </p>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 45px;">#</th>
          <th>Description</th>
          <th style="width: 65px;">Qty</th>
          <th style="width: 100px;">Unit Price</th>
          <th style="width: 110px;">Total</th>
        </tr>
      </thead>

      <tbody>
        ${
          itemRows ||
          `
          <tr>
            <td colspan="5" style="text-align:center;">
              No items found
            </td>
          </tr>
          `
        }
      </tbody>
    </table>

    <div class="totals">

      <div class="total-row">
        <span>Subtotal</span>
        <strong>${money(subtotal)}</strong>
      </div>

      <div class="total-row">
        <span>Shipping Charges</span>
        <strong>${money(shipping)}</strong>
      </div>

      <div class="total-row grand-total">
        <span>Grand Total</span>
        <strong>${money(total)}</strong>
      </div>

    </div>

    <div class="footer">

      <div>
        <p>
          <strong>Declaration</strong>
        </p>

        <p class="muted">
          We hereby declare that the information contained in this
          invoice is correct and complete. This is a computer-generated
          invoice and does not require a physical signature.
        </p>

        <p class="muted">
          All values are in INR.
        </p>

        <p class="muted">
          E. &amp; O.E.
        </p>
      </div>

      <div class="signature">
        <div class="signature-line">
          Authorized Signatory
        </div>

        <p>
          <strong>UrbanSpoonery</strong>
        </p>
      </div>

    </div>

  </div>

  <script>
    window.onload = function () {
      setTimeout(function () {
        window.print();
      }, 300);
    };
  </script>

</body>
</html>
`;

  const printWindow = window.open(
    "",
    "_blank",
    "width=1000,height=800"
  );

  if (!printWindow) {
    alert("Please allow pop-ups to generate the invoice.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(invoiceHtml);
  printWindow.document.close();
}