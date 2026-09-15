import { supabaseAdmin } from "./supabaseAdmin";
export async function adminSignIn(email: string, password: string) {
  return await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });
}
export async function adminSignOut() {
  return await supabaseAdmin.auth.signOut();
}
export async function getCurrentAdminUser() {
  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser();
  return user;
}
export async function isAdmin(): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc("is_admin");
  if (error) {
    console.error("is_admin() check failed:", error);
    return false;
  }
  return data === true;
}
