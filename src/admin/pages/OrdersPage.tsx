import { OrderDetailsModal } from "../components/OrderDetailsModal";
import { useEffect, useState } from "react";
import {
  getOrders,
  updateOrderStatus,
  deleteOrder,
} from "../../lib/orders";
export function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder]   =         useState<any>(null);
  const [openModal, setOpenModal] = useState(false);
  useEffect(() => {
    fetchOrders();
  }, []);
  async function fetchOrders() {
    const data = await getOrders();
    setOrders(data || []);
  }
  async function changeStatus(id: string, status: string) {
    await updateOrderStatus(id, status);
    fetchOrders();
  }
  async function handleDelete(id: string) {
    if (!confirm("Delete this order?")) return;
    await deleteOrder(id);
    fetchOrders();
  }
  const filteredOrders = orders.filter((order) =>
    order.order_number.toLowerCase().includes(search.toLowerCase()) ||
    order.customer_name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            Customer's Orders
          </h1>
          <p className="text-gray-500">
            Manage all orders
          </p>
        </div>
      </div>
      <input
        className="border rounded-lg px-4 py-3 w-full mb-6"
        placeholder="Search orders..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-4">Order</th>
<th className="text-left p-4">Customer</th>
<th className="text-left p-4">Total</th>
<th className="text-left p-4">Payment</th>
<th className="text-left p-4">Payment Status</th>
<th className="text-left p-4">Status</th>
<th className="text-left p-4">Date</th>
<th className="text-center p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr
                key={order.id}
                className="border-t hover:bg-gray-50"
              >
                <td className="p-4">
                  {order.order_number}
                </td>
                <td className="p-4">
                  {order.customer_name}
                </td>
                <td className="p-4">
  ₹{order.total}
</td>
<td className="p-4">
  <span
    className={`px-3 py-1 rounded-full text-white text-sm font-medium ${
      order.payment_method === "UPI"
        ? "bg-green-600"
        : "bg-blue-600"
    }`}
  >
    {order.payment_method}
  </span>
</td>
<td className="p-4">
  <span
    className={`px-3 py-1 rounded-full text-white text-sm font-medium ${
      order.payment_status === "Paid"
        ? "bg-green-600"
        : order.payment_status === "Pending"
        ? "bg-yellow-500"
        : "bg-red-600"
    }`}
  >
    {order.payment_status}
  </span>
</td>
<td className="p-4">
  <select
    value={order.status}
    onChange={(e) =>
      changeStatus(order.id, e.target.value)
    }
    className="border rounded px-2 py-1"
  >
    <option value="pending">Order Received</option>
<option value="out for delivery">Out for Delivery</option>
<option value="delivered">Delivered</option>
<option value="cancelled">Cancelled</option>
  </select>
</td>
<td className="p-4">
  {new Date(order.created_at).toLocaleDateString()}
</td>
                <td className="p-4 text-center">
                <div className="flex justify-center gap-4">
                <button
                    onClick={() => {
                    setSelectedOrder(order);
                    setOpenModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                >
                    View
                </button>
                <button
                    onClick={() => handleDelete(order.id)}
                    className="text-red-600 hover:text-red-800"
                >
                    Delete
                </button>
                </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>                
    </div>
    <OrderDetailsModal
            open={openModal}
            order={selectedOrder}
            onClose={() => {
                setOpenModal(false);
                setSelectedOrder(null);
            }}
            />
    </div>  );}