import { useEffect, useState, FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/CustomerAuthContext';

type Message = { type: 'success' | 'error'; text: string };

export function ProfilePage() {
  const { user, customer, refreshCustomer } = useAuthContext();

  // IMPORTANT:
  // Do not rely on the possibly stale AuthContext customer.
  // This local customer is freshly loaded using the CURRENT user.id.
  const [profileCustomer, setProfileCustomer] = useState<typeof customer>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<Message | null>(null);

  const [email, setEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState<Message | null>(null);

  /*
   * IMPORTANT FIX:
   *
   * Every time the authenticated user changes / ProfilePage mounts,
   * fetch the customer's row directly using user.id.
   *
   * This prevents data from the previous account remaining in the
   * ProfilePage after navigating from another page.
   */
  useEffect(() => {
    let active = true;

    async function loadCurrentCustomer() {
      // Immediately clear old account data.
      setProfileCustomer(null);
      setFirstName('');
      setLastName('');
      setPhone('');
      setProfileMessage(null);

      if (!user?.id) {
        return;
      }

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error('Error loading current customer profile:', error);
        setProfileCustomer(null);
        return;
      }

      if (!data) {
        console.error('No customer profile found for current user:', user.id);
        setProfileCustomer(null);
        return;
      }

      setProfileCustomer(data);

      setFirstName(data.first_name ?? '');
      setLastName(data.last_name ?? '');
      setPhone(data.phone ?? '');
    }

    loadCurrentCustomer();

    return () => {
      active = false;
    };
  }, [user?.id]);

  /*
   * Email always comes from the CURRENT authenticated user.
   */
  useEffect(() => {
    setEmail(user?.email ?? '');
    setEmailMessage(null);
  }, [user?.id, user?.email]);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();

    // Use the CURRENT authenticated user, never a stale customer object.
    if (!user?.id || !profileCustomer || savingProfile) return;

    setSavingProfile(true);
    setProfileMessage(null);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const fullName = [trimmedFirst, trimmedLast]
      .filter(Boolean)
      .join(' ');

    const { data, error } = await supabase
      .from('customers')
      .update({
        first_name: trimmedFirst || null,
        last_name: trimmedLast || null,
        full_name: fullName || null,
        phone: phone.trim() || null,
      })
      .eq('auth_id', user.id)
      .select('*')
      .maybeSingle();

    setSavingProfile(false);

    if (error) {
      console.error('Profile update failed:', error);
      setProfileMessage({
        type: 'error',
        text: 'Could not save your changes. Please try again.',
      });
      return;
    }

    // Update this page immediately with the newly saved row.
    if (data) {
      setProfileCustomer(data);
      setFirstName(data.first_name ?? '');
      setLastName(data.last_name ?? '');
      setPhone(data.phone ?? '');
    }

    // Keep AuthContext synchronized as well.
    await refreshCustomer();

    setProfileMessage({
      type: 'success',
      text: 'Profile updated.',
    });
  }

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();

    const trimmed = email.trim();

    if (
      !trimmed ||
      trimmed === user?.email ||
      savingEmail
    ) {
      return;
    }

    setSavingEmail(true);
    setEmailMessage(null);

    const { error } = await supabase.auth.updateUser({
      email: trimmed,
    });

    setSavingEmail(false);

    if (error) {
      setEmailMessage({
        type: 'error',
        text: error.message,
      });
      return;
    }

    setEmailMessage({
      type: 'success',
      text: `A confirmation link was sent to ${trimmed}. Your email will update once you confirm it.`,
    });
  }

  /*
   * Show loading while the profile belonging to the CURRENT user
   * is being fetched.
   *
   * This is important because we don't want to temporarily display
   * the previous user's information.
   */
  if (!user?.id || !profileCustomer) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center text-gray-500">
        Loading your profile...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 md:py-20 px-4">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
        My Profile
      </h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Personal details
        </h2>

        <p className="text-sm text-gray-500 mb-6">
          {[firstName, lastName].filter(Boolean).join(' ') ||
            'Add your name below.'}
        </p>

        <form
          onSubmit={handleProfileSubmit}
          className="space-y-4"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First name
              </label>

              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Jane"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last name
              </label>

              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile number
            </label>

            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+91 98765 43210"
            />
          </div>

          {profileMessage && (
            <div
              className={`rounded-lg px-4 py-3 text-sm border ${
                profileMessage.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {profileMessage.text}
            </div>
          )}

          <button
            type="submit"
            disabled={savingProfile}
            className="flex items-center gap-2 rounded-xl bg-blue-600 text-white font-medium px-6 py-2.5 hover:bg-blue-700 disabled:opacity-60"
          >
            {savingProfile && (
              <Loader2
                size={18}
                className="animate-spin"
              />
            )}

            {savingProfile
              ? 'Saving...'
              : 'Save changes'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Email address
        </h2>

        <p className="text-sm text-gray-500 mb-6">
          Changing your email requires confirming the new
          address before it takes effect.
        </p>

        <form
          onSubmit={handleEmailSubmit}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {emailMessage && (
            <div
              className={`rounded-lg px-4 py-3 text-sm border ${
                emailMessage.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {emailMessage.text}
            </div>
          )}

          <button
            type="submit"
            disabled={
              savingEmail ||
              email.trim() === user?.email
            }
            className="flex items-center gap-2 rounded-xl bg-blue-600 text-white font-medium px-6 py-2.5 hover:bg-blue-700 disabled:opacity-60"
          >
            {savingEmail && (
              <Loader2
                size={18}
                className="animate-spin"
              />
            )}

            {savingEmail
              ? 'Sending confirmation...'
              : 'Update email'}
          </button>
        </form>
      </div>
    </div>
  );
}