import { useEffect, useState } from "react";
import { getCustomerOrders } from "../../lib/customers";
interface Props {
  open: boolean;
  customer: any;
  onClose: () => void;
}
export function CustomerDetailsModal({
  open,
  customer,
  onClose,
}: Props) {
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => {
    if (open && customer) {
      loadOrders();
    }
  }, [open, customer]);
  async function loadOrders() {
    const data = await getCustomerOrders(customer.email);
    setOrders(data || []);
  }
  if (!open || !customer) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[800px] max-h-[90vh] overflow-y-auto p-5 md:p-8 my-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">
            👤 Customer Details
          </h2>
          <button
            onClick={onClose}
            className="text-2xl"
          >
            ❌
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <p><b>Name:</b> {customer.name}</p>
          <p><b>Email:</b> {customer.email}</p>
          <p><b>Phone:</b> {customer.phone}</p>
          <p><b>Orders:</b> {customer.orders}</p>
          <p><b>Total Spent:</b> ₹{customer.totalSpent}</p>
          <p><b>Address:</b> {customer.address}</p>
          <p><b>State:</b> {customer.state}</p>
          <p><b>Pincode:</b> {customer.pincode}</p>
        </div>
        <hr className="my-6" />
        <h3 className="text-xl font-bold mb-4">
          Recent Orders
        </h3>
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3">Order</th>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-t"
              >
                <td className="p-3">
                  {order.order_number}
                </td>
                <td className="p-3">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
                <td className="p-3">
                  {order.status}
                </td>
                <td className="p-3">
                  ₹{order.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}