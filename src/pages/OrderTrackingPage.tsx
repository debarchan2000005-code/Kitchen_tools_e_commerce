import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../contexts/CustomerAuthContext";
import { generateInvoice } from "../lib/invoice";
import {
  CheckCircle,
  Truck,
  Home,
  XCircle,
  FileDown,
} from "lucide-react";

export function OrderTrackingPage() {
  const { orderNumber } = useParams();
  const { user } = useAuthContext();
  const [order, setOrder] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

useEffect(() => {
  if (!orderNumber || !user?.id) return;

  let active = true;

  async function refreshOrder() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .eq("user_id", user!.id)
      .maybeSingle();

    if (!active) return;

    if (error) {
      console.error("Error loading order:", error);
      return;
    }

    if (!data) {
      setNotFound(true);
      return;
    }

    setNotFound(false);
    setOrder(data);
  }

  refreshOrder();

  const channel = supabase
    .channel(`track-order-${user.id}-${orderNumber}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        if (
          payload.new &&
          payload.new.order_number === orderNumber
        ) {
          setOrder(payload.new);
        }
      }
    )
    .subscribe();

  // Fallback in case Realtime doesn't deliver the update
  const interval = setInterval(refreshOrder, 5000);

  return () => {
    active = false;
    clearInterval(interval);
    supabase.removeChannel(channel);
  };
}, [orderNumber, user?.id]);
  

  async function loadOrder() {

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (error) console.error("Error loading order:", error);
    if (!data) {
      setNotFound(true);
      return;
    }
    setOrder(data);
  }

  async function handleCancelOrder() {
    if (cancelling || !order) return;
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    setCancelling(true);
    setCancelError(null);

    const { data, error } = await supabase.rpc("cancel_order", { order_id: order.id });

    setCancelling(false);

    if (error) {
      const code = error.message || "";
      if (code.includes("ALREADY_DELIVERED")) {
        setCancelError("This order has already been delivered and can no longer be cancelled.");
      } else if (code.includes("ALREADY_CANCELLED")) {
        setCancelError("This order is already cancelled.");
      } else if (code.includes("ORDER_NOT_FOUND") || code.includes("NOT_AUTHENTICATED")) {
        setCancelError("This order could not be found or does not belong to your account.");
      } else {
        setCancelError("Something went wrong while cancelling your order. Please check your connection and try again.");
      }
      return;
    }

    setOrder(data);
  }

  async function handleDownloadInvoice() {
    if (!order) return;
    setDownloadingInvoice(true);
    setInvoiceError(null);
    try {
      const { data: items, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);

      if (error) throw error;
      generateInvoice(order, items || []);
    } catch (err) {
      console.error("Invoice generation failed:", err);
      setInvoiceError("Couldn't generate the invoice right now. Please try again.");
    } finally {
      setDownloadingInvoice(false);
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-4">
        <h1 className="text-xl font-semibold text-gray-900">Order not found</h1>
        <p className="text-gray-500 max-w-sm">
          We couldn't find that order, or it isn't associated with this account. Double-check the order
          number, or sign in to the account it was placed with.
        </p>
        <Link to="/" className="text-blue-600 hover:underline font-medium mt-2">
          Back to home
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading order...
      </div>
    );
  }

  const status = order.status?.toLowerCase();
  const isOwner = !!user && order.user_id === user.id;
  const canCancel = isOwner && status !== "delivered" && status !== "cancelled";

  const currentStep =
  status === "pending"
    ? 0
    : status === "out for delivery"
    ? 1
    : status === "delivered"
    ? 2
    : -1;

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-2xl mx-auto">

        <div className="bg-white rounded-2xl shadow-lg p-8">

          <h1 className="text-3xl font-bold mb-6">
            Track Order
          </h1>

          <p className="text-gray-500">
            Order Number
          </p>

          <h2 className="text-xl font-bold mb-3">
            {order.order_number}
          </h2>
          <div className="mb-8"/>
          <span
  className={`px-4 py-2 rounded-full text-sm font-semibold
  ${
    status === "pending"
      ? "bg-blue-100 text-blue-700"
      : status === "out for delivery"
      ? "bg-yellow-100 text-yellow-700"
      : status === "delivered"
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700"
  }`}
>
  {status === "pending"
  ? "Order Received"
  : status === "out for delivery"
  ? "Out for Delivery"
  : status === "delivered"
  ? "Delivered"
  : status === "cancelled"
  ? "Cancelled"
  : "Order Received"}
</span>


          <div className="flex justify-between items-center mb-8">

            <div className="flex flex-col items-center flex-1">

              <CheckCircle
                className={`w-8 h-8 ${
                  currentStep >= 0
                    ? "text-green-600"
                    : "text-gray-300"
                }`}
              />

              <p className="text-sm mt-2 font-semibold">
                Order Received
              </p>

            </div>

            <div
  className={`h-1 flex-1 rounded-full transition-all duration-700 ${
    currentStep >= 1
      ? "bg-green-500"
      : "bg-gray-300"
  }`}
/>

            <div className="flex flex-col items-center flex-1">

              <Truck
                className={`w-8 h-8 ${
                  currentStep >= 1
                    ? "text-green-600"
                    : "text-gray-300"
                }`}
              />

              <p className="text-sm mt-2 font-semibold">
                Out for Delivery
              </p>

            </div>

            <div
  className={`h-1 flex-1 rounded-full transition-all duration-700 ${
    currentStep >= 2
      ? "bg-green-500"
      : "bg-gray-300"
  }`}
/>

            <div className="flex flex-col items-center flex-1">

              <Home
                className={`w-8 h-8 ${
                  currentStep >= 2
                    ? "text-green-600"
                    : "text-gray-300"
                }`}
              />

              <p className="text-sm mt-2 font-semibold">
                Delivered
              </p>

            </div>

          </div>

          {status === "cancelled" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 mb-6">
              <XCircle className="text-red-600" />
              <span className="font-semibold text-red-700">
                This order has been cancelled.
              </span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-5">

            <div className="bg-gray-50 rounded-xl p-4">

              <p className="text-gray-500 text-sm">
                Payment Status
              </p>

              <p className="font-bold text-lg">
                {order.payment_status}
              </p>

            </div>

            <div className="bg-gray-50 rounded-xl p-4">

              <p className="text-gray-500 text-sm">
                Estimated Delivery
              </p>
<div className="bg-gray-50 rounded-xl p-4">
  <p className="text-gray-500 text-sm">
    Last Updated
  </p>

  <p className="font-bold">
    {new Date(order.updated_at || order.created_at).toLocaleString()}
  </p>
</div>
              <p className="font-bold">
                {new Date(
                  order.estimated_delivery
                ).toLocaleDateString()}
              </p>

            </div>

          </div>

          <div className="mt-8 bg-blue-50 rounded-xl p-5">

            <h3 className="font-bold text-lg mb-2">
              Delivery Details
            </h3>

            {status === "pending" && (
              <p>
                Your order has been received and will be packed shortly.
              </p>
            )}

            {status === "out for delivery" && (
              <p>
                Our delivery person has left with your order and is on the way.
              </p>
            )}

            {status === "delivered" && (
              <p>
                Your order has been delivered successfully.
              </p>
            )}

            {status === "cancelled" && (
              <p>
                This order was cancelled. <br />If you have already paid, your refund will be processed shortly.
              </p>
              
            )}
            
          </div>
          {cancelError && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              {cancelError}
            </div>
          )}
          {invoiceError && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              {invoiceError}
            </div>
          )}

<div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col sm:flex-row gap-3 justify-center">
  {canCancel && (
    <button
      onClick={handleCancelOrder}
      disabled={cancelling}
      className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition"
    >
      {cancelling ? "Cancelling..." : "Cancel Order"}
    </button>
  )}
  <button
    onClick={handleDownloadInvoice}
    disabled={downloadingInvoice}
    className="inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition"
  >
    <FileDown className="w-5 h-5" />
    {downloadingInvoice ? "Preparing..." : "Download Invoice"}
  </button>
  <Link
    to="/"
    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition"
  >
    🏠 Back to Home
  </Link>
</div>
        </div>

      </div>
    </div>
  );
}