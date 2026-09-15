import { Link } from 'react-router-dom';
import {
  ChefHat,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getSettings } from '../../lib/settings';
import { supabase } from '../../lib/supabase';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = useState<any>(null);
  const [siteNav, setSiteNav] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const [data, navigationResult] = await Promise.all([
        getSettings(),
        supabase
          .from('site_navigation')
          .select('*')
          .eq('id', 1)
          .maybeSingle(),
      ]);

      if (!mounted) return;

      setSettings(data);

      if (!navigationResult.error && navigationResult.data) {
        setSiteNav(navigationResult.data);
      }
    }

    load();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        load();
      }
    };

    window.addEventListener('focus', load);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      window.removeEventListener('focus', load);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (!settings) return null;
  if (siteNav?.footer_enabled === false) return null;

  const storeName = siteNav?.brand_name || settings.store_name;
  const footerDescription =
    siteNav?.footer_description || settings.footer_description;
  const footerAddress = siteNav?.footer_address || settings.address;
  const footerPhone = siteNav?.footer_phone || settings.phone_1;
  const footerEmail = siteNav?.footer_email || settings.store_email;
  const facebookUrl = siteNav?.facebook_url || settings.footer_facebook;
  const instagramUrl = siteNav?.instagram_url || settings.footer_instagram;
  const twitterUrl = siteNav?.twitter_url || settings.footer_twitter;
  const youtubeUrl = siteNav?.youtube_url || settings.footer_youtube;
  const copyright =
    siteNav?.footer_copyright ||
    `© ${currentYear} ${storeName}. All rights reserved.`;
  const developerText =
    siteNav?.footer_developer_text || 'Website Development & Maintenance';

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                {storeName}
              </span>
            </Link>

            <p className="mt-4 text-sm text-gray-400 leading-relaxed">
              {footerDescription}
            </p>

            <div className="flex gap-4 mt-6">
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-gray-800 rounded-lg hover:bg-primary-600"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}

              {twitterUrl && (
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-gray-800 rounded-lg hover:bg-primary-600"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              )}

              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-gray-800 rounded-lg hover:bg-primary-600"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}

              {youtubeUrl && (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-gray-800 rounded-lg hover:bg-primary-600"
                >
                  <Youtube className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {(siteNav?.footer_quick_links || []).filter((link: any) => link.enabled !== false).map((link: any) => (
                <li key={link.id}>
                  <Link to={link.path} className="hover:text-white transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer */}
          <div>
            <h3 className="text-white font-semibold mb-4">
              Customer Service
            </h3>
            <ul className="space-y-3">
              {(siteNav?.footer_service_links || []).filter((link: any) => link.enabled !== false).map((link: any) => (
                <li key={link.id}>
                  <Link to={link.path} className="hover:text-white transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <MapPin className="w-5 h-5 text-primary-400 mt-1" />
                <span>{footerAddress}</span>
              </li>
              <li className="flex gap-3">
                <Phone className="w-5 h-5 text-primary-400" />
                <a href={`tel:${footerPhone}`}>{footerPhone}</a>
              </li>
              <li className="flex gap-3">
                <Mail className="w-5 h-5 text-primary-400" />
                <a href={`mailto:${footerEmail}`}>{footerEmail}</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-6">
          <div className="text-center space-y-2">
            <p>{copyright}</p>
            {(developerText ||
              siteNav?.footer_developer_phone ||
              siteNav?.footer_developer_email) && (
              <p className="text-gray-500">
                {developerText &&
                  (siteNav?.footer_developer_url ? (
                    <a
                      href={siteNav.footer_developer_url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-white transition"
                    >
                      {developerText}
                    </a>
                  ) : (
                    developerText
                  ))}

                {siteNav?.footer_developer_phone && (
                  <>
                    {developerText && " | "}
                    <a
                      href={`tel:${siteNav.footer_developer_phone}`}
                      className="hover:text-white transition"
                    >
                      {siteNav.footer_developer_phone}
                    </a>
                  </>
                )}

                {siteNav?.footer_developer_email && (
                  <>
                    {(developerText || siteNav?.footer_developer_phone) && " | "}
                    <a
                      href={`mailto:${siteNav.footer_developer_email}`}
                      className="hover:text-white transition"
                    >
                      {siteNav.footer_developer_email}
                    </a>
                  </>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
