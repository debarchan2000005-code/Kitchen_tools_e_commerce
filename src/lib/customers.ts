import { supabaseAdmin as supabase } from "./supabaseAdmin";

export async function getCustomers() {
  const [{ data: orders, error: ordersError }, { data: customers, error: customersError }] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: false }),

    supabase.from("customers").select("id, auth_id, full_name, email, phone"),
  ]);

  if (ordersError) throw ordersError;
  if (customersError) throw customersError;
  const customerByAuthId = new Map(
    (customers || []).map((c: any) => [c.auth_id, c])
  );

  const map = new Map();

  (orders || []).forEach((order: any) => {
    const account = order.user_id ? customerByAuthId.get(order.user_id) : undefined;
    const key = account ? `account:${account.auth_id}` : `guest:${order.customer_email}`;

    if (!map.has(key)) {
      map.set(key, {
        id: account ? account.id : order.id,
        name: account ? account.full_name || "" : order.customer_name,
        email: account ? account.email || "" : order.customer_email,
        phone: account ? account.phone || "" : order.customer_phone,
        address: order.shipping_address,
        state: order.shipping_state,
        pincode: order.shipping_pincode,
        totalSpent: Number(order.total),
        orders: 1,
        lastOrder: order.created_at,
      });
    } else {
      const customer = map.get(key);

      customer.orders++;
      customer.totalSpent += Number(order.total);

      if (
        new Date(order.created_at) >
        new Date(customer.lastOrder)
      ) {
        customer.lastOrder = order.created_at;
      }
    }
  });

  return [...map.values()];
}

export async function getCustomerOrders(email: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_email", email)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}
export async function getUsers() {
  const { data, error } = await supabase
    .from("customers")
    .select("*");

  console.log("Raw Data:", data);
  console.log("Raw Error:", error);

  if (error) throw error;

  return data;
}