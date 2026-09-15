import { supabaseAdmin as supabase } from "./supabaseAdmin";

export async function getOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}
export async function updateOrderStatus(id: string, status: string) {
  const { data: order } = await supabase
    .from("orders")
    .select("payment_method")
    .eq("id", id)
    .single();

  const updateData: any = {
    status,
  };

  if (order && order.payment_method === "COD") {
    if (status === "delivered") {
      updateData.payment_status = "Paid";
    } else {
      updateData.payment_status = "Unpaid";
    }
  }

  const { error } = await supabase
    .from("orders")
    .update(updateData)
    .eq("id", id);

  if (error) throw error;
}
export async function deleteOrder(id: string) {
  const { data, error } = await supabase
    .from("orders")
    .delete()
    .eq("id", id)
    .select();

  if (error) throw error;

  return data;
}

export async function getOrderItems(orderId: string) {
  const { data, error } = await supabase
    .from("order_items")
    .select(`
      *,
      products (
        image
      )
    `)
    .eq("order_id", orderId);

  if (error) throw error;

  return data;
}