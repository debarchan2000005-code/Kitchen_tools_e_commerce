import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
} from '../lib/auth';

interface Customer {
  id: string;
  auth_id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: 'customer' | 'admin';
}

interface CustomerAuthContextType {
  session: Session | null;
  user: User | null;
  customer: Customer | null;
  isAnonymous: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signUp: (
    fullName: string,
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

/**
 * CustomerAuthProvider owns the CUSTOMER/GUEST identity for this browser.
 *
 * It talks exclusively to the customer Supabase client (src/lib/supabase.ts,
 * storageKey 'sb-customer-auth'). It has no knowledge of admin auth at all -
 * there is no isAdmin field, no admin sign-in path, nothing that reads from
 * or writes to the admin client. That separation is what makes it safe for
 * this provider and AdminAuthProvider to be mounted at the same time in the
 * same browser tab: they simply never touch each other's session.
 */
export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const isAnonymous = !!user?.is_anonymous;
  const isAuthenticated = !!user && !isAnonymous;
  const activeUserIdRef = useRef<string | null>(null);

  async function fetchCustomerRow(userId: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('auth_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Customer fetch failed:', error);
      return null;
    }

    return data;
  }

  async function refreshCustomerState(sessionUser: User): Promise<Customer | null> {
    activeUserIdRef.current = sessionUser.id;

    if (sessionUser.is_anonymous) {
      setCustomer(null);
      return null;
    }

    const customerRow = await fetchCustomerRow(sessionUser.id);

    // Stale-response guard: if the user changed (logout/switch) while this
    // fetch was in flight, don't let it overwrite the newer state.
    if (activeUserIdRef.current !== sessionUser.id) {
      return null;
    }

    setCustomer(customerRow);
    return customerRow;
  }

  async function mergeGuestData(oldAnonId: string | null) {
    if (!oldAnonId) return;

    const { error } = await supabase.rpc('merge_anonymous_data', {
      old_anon_id: oldAnonId,
    });

    if (error) {
      console.error('Guest data merge failed:', error);
    }
  }

  useEffect(() => {
    let active = true;

    async function init() {
      let {
        data: { session: initialSession },
      } = await supabase.auth.getSession();

      if (!initialSession) {
        const { data, error } = await supabase.auth.signInAnonymously();

        if (error) {
          console.error('Anonymous sign-in failed:', error);
        }

        initialSession = data?.session ?? null;
      }

      if (!active) return;

      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        await refreshCustomerState(initialSession.user);
      } else {
        activeUserIdRef.current = null;
        setCustomer(null);
      }

      if (active) {
        setLoading(false);
      }
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (!newSession?.user) {
          activeUserIdRef.current = null;
          setCustomer(null);
          return;
        }

        setTimeout(() => {
          refreshCustomerState(newSession.user).catch((error) => {
            console.error('Auth state refresh failed:', error);
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
    // Clear the previous account's data from state immediately, before
    // the new session even resolves, so no stale profile/orders can flash
    // for the incoming account.
    activeUserIdRef.current = null;
    setCustomer(null);

    const priorAnonId = user?.is_anonymous ? user.id : null;

    const { error } = await authSignIn(email, password);

    if (error) {
      if (
        error.message
          .toLowerCase()
          .includes('invalid login credentials')
      ) {
        return { error: 'Incorrect email or password.' };
      }

      return { error: error.message };
    }

    const {
      data: { session: newSession },
    } = await supabase.auth.getSession();

    if (!newSession?.user) {
      return {
        error: 'Login succeeded, but the authenticated session could not be established.',
      };
    }

    setSession(newSession);
    setUser(newSession.user);

    await mergeGuestData(priorAnonId);
    await refreshCustomerState(newSession.user);

    return { error: null };
  }

  async function signUp(
    fullName: string,
    email: string,
    password: string
  ) {
    const priorAnonId = user?.is_anonymous ? user.id : null;

    const { data, error } = await authSignUp(
      fullName,
      email,
      password
    );

    if (error) {
      if (
        error.message
          .toLowerCase()
          .includes('already registered')
      ) {
        return {
          error: 'An account with this email already exists.',
        };
      }

      return {
        error: error.message,
      };
    }

    if (data?.session) {
      activeUserIdRef.current = null;
      setCustomer(null);

      setSession(data.session);
      setUser(data.session.user);

      await mergeGuestData(priorAnonId);
      await refreshCustomerState(data.session.user);
    }

    return {
      error: null,
    };
  }

  async function signOut() {
    // Invalidate the outgoing account's state completely before doing
    // anything else, so nothing async from it can land afterward.
    activeUserIdRef.current = null;
    setCustomer(null);
    setSession(null);
    setUser(null);

    await authSignOut();

    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      console.error('Post-logout anonymous sign-in failed:', error);
      return;
    }

    setSession(data.session);
    setUser(data.session?.user ?? null);
    if (data.session?.user) {
      activeUserIdRef.current = data.session.user.id;
    }
  }

  async function refreshCustomer() {
    if (!user || user.is_anonymous) return;

    const targetId = user.id;
    activeUserIdRef.current = targetId;

    const row = await fetchCustomerRow(targetId);

    if (activeUserIdRef.current !== targetId) return;

    setCustomer(row);
  }

  return (
    <CustomerAuthContext.Provider
      value={{
        session,
        user,
        customer,
        isAnonymous,
        isAuthenticated,
        loading,
        signIn,
        signUp,
        signOut,
        refreshCustomer,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(CustomerAuthContext);

  if (!ctx) {
    throw new Error(
      'useAuth must be used within CustomerAuthProvider'
    );
  }

  return ctx;
}

export const useAuthContext = useAuth;
