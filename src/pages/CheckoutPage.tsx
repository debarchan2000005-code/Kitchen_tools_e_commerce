import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Truck, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { useAuthContext } from '../contexts/CustomerAuthContext';
import { formatPrice, generateOrderNumber, getEstimatedDelivery } from '../lib/utils';
import type { CheckoutFormData } from '../types';
export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'details' | 'review' | 'processing'>('details');
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI">("COD");
  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({});
  const shippingCost = total >= 999 ? 0 : 99;
  const orderTotal = total + shippingCost;
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CheckoutFormData, string>> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof CheckoutFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };
  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setStep('review');
    }
  };
  const handlePlaceOrder = async (isUPI = false) => {
    setStep('processing');
    setLoading(true);
    try {
      const orderNumber = generateOrderNumber();
      const estimatedDelivery = getEstimatedDelivery();
      if (!user) {
        throw new Error('Still setting up your session - please try again in a moment.');
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: user.id,
          customer_name: formData.fullName,
          customer_email: formData.email,
          customer_phone: formData.phone,
          shipping_address: formData.address,
          shipping_city: formData.city,
          shipping_state: formData.state,
          shipping_pincode: formData.pincode,
          subtotal: total,
          shipping_cost: shippingCost,
          total: orderTotal,
          status: "Order Received",
          payment_status: "Unpaid",
          payment_method: "COD",
          estimated_delivery:estimatedDelivery.toISOString().split("T")[0],
        })
        .select()
        .single();
      if (orderError) throw orderError;
      
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        total: item.product.price * item.quantity,
      }));
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      if (itemsError) throw itemsError;
      
      await clearCart();

if (isUPI) {
  navigate("/payment", {
    state: {
      orderId: order.id,
      orderNumber,
      estimatedDelivery: estimatedDelivery.toISOString(),
    },
  });
} else {
  navigate(`/order-success/${orderNumber}`, {
  state: {
    estimatedDelivery: estimatedDelivery.toISOString(),
    paymentMethod: "COD",
  },
});
}
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
      setStep('review');
    } finally {
      setLoading(false);
    }
  };
  if (items.length === 0) {
    return (
      <div className="container-custom py-16 text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Cart is Empty</h1>
        <p className="text-gray-600 mb-8">
          Add some products before checking out.
        </p>
        <Link to="/products" className="btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }
  return (
    <div className="animate-fade-in">
      <section className="bg-gray-900 text-white py-8 md:py-12">
        <div className="container-custom">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-300 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-2xl md:text-3xl font-bold">Checkout</h1>
        </div>
      </section>
      
      <section className="py-8 md:py-12 bg-gray-50 min-h-[60vh]">
        <div className="container-custom">
          {step === 'details' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-xl p-6 md:p-8">
                      <div className="flex items-center gap-4 mb-8">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-medium">
                      1
                    </div>
                    <span className="font-medium text-gray-900">Details</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-gray-200"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center font-medium">
                      2
                    </div>
                    <span className="text-gray-400">Review</span>
                  </div>
                </div>
                
                <form onSubmit={handleSubmitDetails}>
                  <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-primary-600" />
                    Shipping Information
                  </h2>
                  <div className="grid gap-4">
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className={`input ${errors.fullName ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {errors.fullName && (
                        <p className="text-sm text-red-500 mt-1">{errors.fullName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        className={`input ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="9395392986"
                        className={`input ${errors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {errors.phone && (
                        <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Near Reliance Petrol Pump, Lanka"
                        className={`input ${errors.address ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {errors.address && (
                        <p className="text-sm text-red-500 mt-1">{errors.address}</p>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="City"
                          className={`input ${errors.city ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {errors.city && (
                          <p className="text-sm text-red-500 mt-1">{errors.city}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State *
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          placeholder="Assam"
                          className={`input ${errors.state ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {errors.state && (
                          <p className="text-sm text-red-500 mt-1">{errors.state}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleInputChange}
                          placeholder="782446"
                          className={`input ${errors.pincode ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {errors.pincode && (
                          <p className="text-sm text-red-500 mt-1">{errors.pincode}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="btn-primary w-full mt-8 py-4 justify-center">
                    Continue to Review
                  </button>
                </form>
              </div>
            </div>
          )}
          {step === 'review' && (
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">

                {/* Shipping Details */}
                <div className="bg-white rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-gray-900">Shipping Details</h2>
                    <button
                      onClick={() => setStep('details')}
                      className="text-primary-600 text-sm hover:text-primary-700"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="text-gray-600 space-y-1">
                    <p className="font-medium text-gray-900">{formData.fullName}</p>
                    <p>{formData.address}</p>
                    <p>{formData.city}, {formData.state} - {formData.pincode}</p>
                    <p>Phone: {formData.phone}</p>
                    <p>Email: {formData.email}</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6">
                  <h2 className="font-bold text-gray-900 mb-4">Order Items</h2>
                  <div className="space-y-4">
                    {items.map((item) => {
                      const primaryImage =
                        item.product.images?.find((img) => img.is_primary) ||
                        item.product.images?.[0];
                      const displayImageUrl = item.product.image || primaryImage?.image_url;
                      return (
                        <div key={item.id} className="flex gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                            {displayImageUrl ? (
                              <img
                                src={displayImageUrl}
                                alt={primaryImage?.alt_text || item.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.product.name}</p>
                            <p className="text-sm text-gray-500">
                              Qty: {item.quantity} x {formatPrice(item.product.price)}
                            </p>
                          </div>
                          <p className="font-medium text-gray-900">
                            {formatPrice(item.product.price * item.quantity)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6">
  <h2 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
    <CreditCard className="w-5 h-5 text-primary-600" />
    Choose Payment Method
  </h2>
  <div className="space-y-4">
    <label
      className={`border rounded-xl p-4 flex items-start gap-4 cursor-pointer transition
      ${
        paymentMethod === "COD"
          ? "border-blue-600 bg-blue-50"
          : "border-gray-200"
      }`}
    >
      <input
        type="radio"
        checked={paymentMethod === "COD"}
        onChange={() => setPaymentMethod("COD")}
      />
      <div>
        <h3 className="font-semibold">
          Cash on Delivery
        </h3>
        <p className="text-sm text-gray-500">
          (UPI payment through website is currently unavailable.)
        </p>
      </div>
    </label>
{false && (
  <label
    className={`border rounded-xl p-4 flex items-start gap-4 cursor-pointer transition
    ${
      paymentMethod === "UPI"
        ? "border-green-600 bg-green-50"
        : "border-gray-200"
    }`}
  >
    <input
      type="radio"
      checked={paymentMethod === "UPI"}
      onChange={() => setPaymentMethod("UPI")}
    />

    <div>
      <h3 className="font-semibold">
        Pay Online / UPI
      </h3>

      <p className="text-sm text-gray-500">
        PhonePe • Google Pay • Paytm • BHIM
      </p>
    </div>
  </label>
)}

  </div>
</div>
</div>

              <div className="lg:sticky lg:top-24">     
                <div className="bg-white rounded-xl p-6">
                  <h2 className="font-bold text-gray-900 mb-6">Order Summary</h2>
                  <div className="space-y-3 pb-6 border-b border-gray-200">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal ({items.length} items)</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span>{shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between py-6 text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(orderTotal)}</span>
                  </div>
                  <button
  /*onClick={() => { remove comments for enabling online payment system
    if (paymentMethod === "COD") {
  handlePlaceOrder(false);
} else {
  handlePlaceOrder(true);
}
  }}
*/
  className="btn-primary w-full py-4 justify-center"
>
  {/* remove comments for enabling online payment system
  {paymentMethod === "COD"*/}
    <button
  onClick={() => handlePlaceOrder(false)}
  className="btn-primary w-full py-4 justify-center"
>
  Place Order
</button>
   {/* : "Continue to Payment"}  remove comments for enabling online payment system*/}
    
</button>
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    By placing this order, you agree to our terms and conditions.
                  </p>
                </div>
              </div>
            </div>
          )}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-600">Processing your order...</p>
            </div>
          )}
        </div>
      </section>
    </div>  );}