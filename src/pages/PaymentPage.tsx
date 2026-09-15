import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
export function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    orderId,
    orderNumber,
    estimatedDelivery,
  } = location.state || {};
  const [settings, setSettings] = useState<any>(null);
  useEffect(() => {
    loadSettings();
  }, []);
async function loadSettings() {
  const { data } = await supabase
    .from("settings")
    .select("*")
    .single();

  console.log(data);
  console.log("QR URL:", data.payment_qr);

  setSettings(data);
}
  
  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading payment details...
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-6">

      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">
          Complete Payment
        </h1>
        <img
            src={settings.payment_qr}
            alt="UPI QR"
            className="w-64 h-64 object-contain mx-auto border rounded-lg"
            />
        <div className="mt-6 space-y-3">
          <p>
            <strong>UPI ID:</strong>
            <br />
            {settings.upi_id}
          </p>
          <p>
            <strong>Phone:</strong>
            <br />
            {settings.phonepe_number}
          </p>
        </div>
        <button
  onClick={async () => {

    await supabase
  .from("orders")
  .update({
    payment_status: "Paid",
    status: "processing",
  })
  .eq("id", orderId);

    navigate(`/order-success/${orderNumber}`, {
  state: {
    estimatedDelivery,
    paymentMethod: "UPI",
  },
});

  }}
  className="w-full mt-8 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg"
>
  Payment Done Succesfully
</button>
      </div>
    </div>
    );}