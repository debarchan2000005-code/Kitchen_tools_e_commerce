import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle, Package, Truck, Home } from 'lucide-react';
import { formatDate } from '../lib/utils';

export function OrderSuccessPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const location = useLocation();
  const estimatedDelivery = location.state?.estimatedDelivery;
  console.log(location.state);
  return (
    <div className="container-custom py-12 md:py-20">
      <div className="max-w-2xl mx-auto text-center animate-fade-in">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-14 h-14 text-green-500" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Order Placed Successfully!
        </h1>
        <p className="text-gray-600 mb-8">
          Thank you for your purchase. We've received your order and will ship it soon.
        </p>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8 text-left">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
            <Package className="w-6 h-6 text-primary-600" />
            <div>
              <p className="text-sm text-gray-500">Order Number</p>
              <p className="text-lg font-bold text-gray-900">{orderNumber}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            
            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Estimated Delivery</p>
                <p className="font-medium text-gray-900">
                  {estimatedDelivery ? formatDate(estimatedDelivery) : '7-10 business days'}
                </p>
              </div>
            </div>
            <div>
  <p className="text-sm text-gray-500">Payment Method</p>
  <p className="font-medium text-gray-900">
    {location.state?.paymentMethod === "UPI"
      ? "UPI Payment"
      : "Cash on Delivery"}
  </p>
</div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
          <h2 className="font-bold text-gray-900 mb-4">What Happens Next?</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                1
              </div>
              <p className="text-gray-600">
                We've sent an order confirmation to your email address.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                2
              </div>
              <p className="text-gray-600">
                Our team will pack your items and prepare them for shipping.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                3
              </div>
              <p className="text-gray-600">
                Your order will be delivered to your doorstep. Pay with cash on delivery.
              </p>
            </div>
          
        </div>
        <div className="bg-primary-50 rounded-xl p-6 mb-8">
          <p className="text-gray-700 mb-2">
            Need help with your order?
          </p>
          <p className="text-sm text-gray-600">
            Call us at <a href="tel:+919395392986" className="text-primary-600 font-medium">+91 9395392986</a> or email us at{' '}
            <a href="mailto:debarchan200005@gmail.com" className="text-primary-600 font-medium">debarchan200005@gmail.com</a>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/products" className="btn-primary py-4 px-8">
            Continue Shopping
          </Link>
          <Link to="/" className="btn-secondary py-4 px-8">
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
