import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import {
  adminSignIn,
  adminSignOut,
  isAdmin as checkIsAdmin,
} from '../lib/adminAuth';

interface AdminAuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null; isAdmin: boolean }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

/**
 * AdminAuthProvider owns the ADMIN identity for this browser.
 *
 * It talks exclusively to the admin Supabase client (src/lib/supabaseAdmin.ts,
 * storageKey 'sb-admin-auth'). Unlike CustomerAuthProvider:
 *   - It never calls signInAnonymously() - there is no guest admin state.
 *   - It has no cart/wishlist/guest-merge concerns.
 *   - Signing in or out here only ever changes the 'sb-admin-auth' storage
 *     key, so it can never replace, clear, or otherwise affect whatever
 *     customer (or guest) session CustomerAuthProvider is holding in the
 *     same browser tab at the same time.
 */
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const activeUserIdRef = useRef<string | null>(null);

  async function refreshAdminStatus(sessionUser: User): Promise<boolean> {
    activeUserIdRef.current = sessionUser.id;

    const adminResult = await checkIsAdmin();

    if (activeUserIdRef.current !== sessionUser.id) {
      return isAdmin;
    }

    setIsAdmin(adminResult);
    return adminResult;
  }

  useEffect(() => {
    let active = true;

    async function init() {
      const {
        data: { session: initialSession },
      } = await supabaseAdmin.auth.getSession();

      if (!active) return;

      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        await refreshAdminStatus(initialSession.user);
      } else {
        activeUserIdRef.current = null;
        setIsAdmin(false);
      }

      if (active) {
        setLoading(false);
      }
    }

    init();

    const { data: listener } = supabaseAdmin.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (!newSession?.user) {
          activeUserIdRef.current = null;
          setIsAdmin(false);
          return;
        }

        setTimeout(() => {
          refreshAdminStatus(newSession.user).catch((error) => {
            console.error('Admin auth state refresh failed:', error);
          });
        }, 0);
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    activeUserIdRef.current = null;
    setIsAdmin(false);

    const { error } = await adminSignIn(email, password);

    if (error) {
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        return { error: 'Incorrect email or password.', isAdmin: false };
      }
      return { error: error.message, isAdmin: false };
    }

    const {
      data: { session: newSession },
    } = await supabaseAdmin.auth.getSession();

    if (!newSession?.user) {
      return {
        error: 'Login succeeded, but the authenticated session could not be established.',
        isAdmin: false,
      };
    }

    setSession(newSession);
    setUser(newSession.user);

    const adminResult = await refreshAdminStatus(newSession.user);

    if (!adminResult) {
      // This account is not an admin. Deny access and immediately drop the
      // admin session again - never leave a non-admin session sitting in
      // the admin client.
      await adminSignOut();
      activeUserIdRef.current = null;
      setSession(null);
      setUser(null);
      setIsAdmin(false);
      return { error: 'This account does not have administrator access.', isAdmin: false };
    }

    return { error: null, isAdmin: true };
  }

  async function signOut() {
    activeUserIdRef.current = null;
    setIsAdmin(false);
    setSession(null);
    setUser(null);

    await adminSignOut();
  }

  return (
    <AdminAuthContext.Provider
      value={{ session, user, isAdmin, loading, signIn, signOut }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);

  if (!ctx) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }

  return ctx;
}
