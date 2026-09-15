import { useAuthContext } from "../contexts/CustomerAuthContext";

export function useAuth() {
  return useAuthContext();
}