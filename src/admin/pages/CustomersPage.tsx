import { useEffect, useState } from "react";
import { getCustomers } from "../../lib/customers";
import { CustomerDetailsModal } from "../components/CustomerDetailsModal";
export function CustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [openModal, setOpenModal] = useState(false);
  useEffect(() => {
    loadCustomers();
  }, []);
  async function loadCustomers() {
    const data = await getCustomers();
    setCustomers(data || []);
  }
  const filteredCustomers = customers.filter((customer) =>
    (customer.name || "").toLowerCase().includes(search.toLowerCase()) ||
    customer.email.toLowerCase().includes(search.toLowerCase()) ||
    customer.phone.includes(search)
  );
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">
          Customers
        </h1>
        <p className="text-gray-600 mt-2">
          Manage all customers
        </p>
      </div>
      <input
        type="text"
        placeholder="Search customers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border rounded-lg p-3"
      />
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-4">Customer</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Phone</th>
              <th className="text-left p-4">Orders</th>
              <th className="text-left p-4">Total Spent</th>
              <th className="text-left p-4">Last Order</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr
                key={customer.email}
                className="border-t hover:bg-gray-50"
              >
                <td className="p-4 font-medium">
                  {customer.name}
                </td>
                <td className="p-4">
                  {customer.email}
                </td>
                <td className="p-4">
                  {customer.phone}
                </td>
                <td className="p-4">
                  {customer.orders}
                  </td>
                <td className="p-4">
                  ₹{customer.totalSpent}
                </td>
                <td className="p-4">
                  {new Date(customer.lastOrder).toLocaleDateString()}
                </td>
                <td className="p-4">
                    <button
                    onClick={() => {
                        setSelectedCustomer(customer);
                        setOpenModal(true);
                    }}
                    className="text-blue-600 hover:underline"
                    >
                    View
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
                    <CustomerDetailsModal
                        open={openModal}
                        customer={selectedCustomer}
                        onClose={() => setOpenModal(false)}
                        />
    </div>
  );
}