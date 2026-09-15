import { supabase } from "./supabase";
// Sign Up
export async function signUp(
  fullName: string,
  email: string,
  password: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  console.log("Signup Error:", error);
  console.log("Signup Data:", data);
  return { data, error };
}
// Login
export async function signIn(
  email: string,
  password: string
) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}
// Logout
export async function signOut() {
  return await supabase.auth.signOut();
}
// Current User
export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
