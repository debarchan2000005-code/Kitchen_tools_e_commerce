import { useEffect, useState } from "react";
import { getOrderItems } from "../../lib/orders";
import { generateInvoice } from "../../lib/invoice";
interface Props {
  open: boolean;
  order: any;
  onClose: () => void;
}

export function OrderDetailsModal({
  open,
  order,
  onClose,
}: Props) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (open && order) {
      loadItems();
    }
  }, [open, order]);

  async function loadItems() {
    const data = await getOrderItems(order.id);
    setItems(data || []);
  }

  if (!open || !order) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4 overflow-y-auto">

      <div className="bg-white rounded-xl shadow-xl w-full max-w-[700px] max-h-[90vh] overflow-y-auto p-5 md:p-8 my-auto">

<div className="flex justify-between items-center mb-6">

  <div>
    <h2 className="text-3xl font-bold">
      📦 Order Details
    </h2>

    <p className="text-gray-500 mt-1">
      {order.order_number}
    </p>
  </div>

  <div className="flex items-center gap-3">

    <button
      onClick={() => generateInvoice(order, items)}
      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
    >
      📄 Download Invoice
    </button>

    <button
      onClick={onClose}
      className="text-gray-500 text-xl"
    >
      ✕
    </button>

  </div>

</div>
        <h3 className="text-xl          font-semibold        mb-3">
            👤 Customer Information
        </h3>
        <div className="bg-gray-50 rounded-xl p-5 space-y-2 shadow-sm">

          <p><b>Order:</b> {order.order_number}</p>

          <p><b>Customer:</b> {order.customer_name}</p>

          <p><b>Email:</b> {order.customer_email}</p>

            <p><b>Phone:</b> {order.customer_phone}</p>
            <p>
            <b>Order Date:</b>{" "}
            {new Date(order.created_at).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            })}
            </p>
            <hr className="my-5" />

                <h3 className="text-xl font-semibold">
                📍 Shipping Address
            </h3>

          <p><b>Address:</b> {order.shipping_address}</p>

          <p><b>State:</b> {order.shipping_state}</p>

          <p><b>Pincode:</b> {order.shipping_pincode}</p>

          <div className="mt-4">
            <span
                className={`px-4 py-2 rounded-full text-white text-sm font-semibold
                ${
                    order.status === "pending"
                    ? "bg-yellow-500"
                    : order.status === "processing"
                    ? "bg-blue-500"
                    : order.status === "shipped"
                    ? "bg-purple-500"
                    : order.status === "delivered"
                    ? "bg-green-600"
                    : "bg-red-600"
                }`}
            >
                {order.status.toUpperCase()}
            </span>
            </div>

          <p><b>Total:</b> ₹{order.total}</p>

        </div>

        <hr className="my-6"/>

        <h3 className="font-bold text-lg mb-4">
          Ordered Products
        </h3>

        <table className="w-full">

          <thead className="bg-gray-100">

            <tr>

              <th className="text-left p-2">
                Product
              </th>

              <th className="text-left p-2">
                Qty
              </th>

              <th className="text-left p-2">
                Price
              </th>

              <th className="text-left p-2">
                Total
              </th>

            </tr>

          </thead>

          <tbody>

            {items.map((item) => (

              <tr
                key={item.id}
                className="border-t"
              >

                <td className="p-2">
                <div className="flex items-center gap-3">

                    <img
                    src={
                        item.products?.image ||
                        "https://placehold.co/60x60"
                    }
                    className="w-12 h-12 rounded-lg object-cover border"
                    />

                    <div>
                    <p className="font-medium">
                        {item.product_name}
                    </p>
                    </div>

                </div>
                </td>

                <td className="p-2">
                  {item.quantity}
                </td>

                <td className="p-2">
                  ₹{item.price}
                </td>

                <td className="p-2">
                  ₹{item.total}
                </td>

              </tr>

            ))}

          </tbody>

        </table>
        <div className="mt-8 bg-gray-50 rounded-xl p-5">

            <h3 className="text-xl font-semibold mb-4">
                💳 Order Summary
            </h3>

            <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
            </div>

            <div className="flex justify-between mb-2">
                <span>Shipping</span>
                <span>₹{order.shipping_cost}</span>
            </div>

            <hr className="my-3"/>

            <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>₹{order.total}</span>
            </div>

            </div>
      </div>
<div className="mt-6 bg-blue-50 rounded-xl p-5">

    <h3 className="text-xl font-semibold mb-3">
        🚚 Delivery Information
    </h3>

    <p>
        <b>Estimated Delivery:</b>
    </p>

    <p className="text-lg font-bold text-blue-700">
        {new Date(order.estimated_delivery).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        })}
    </p>

</div>
    </div>
  );
}