import { Outlet } from "react-router-dom";
import { AdminAuthProvider } from "../../contexts/AdminAuthContext";

// Pathless layout route: everything under /admin/* (login, forgot/reset
// password, and the protected dashboard) renders inside this provider.
// It is never mounted anywhere in the customer route tree, so admin
// sign-in/out only ever touches the admin Supabase client's session.
export function AdminAuthLayout() {
  return (
    <AdminAuthProvider>
      <Outlet />
    </AdminAuthProvider>
  );
}
