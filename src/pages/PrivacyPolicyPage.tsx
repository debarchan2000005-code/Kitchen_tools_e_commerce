import { useEffect, useState } from "react";
import { getSettings } from "../lib/settings";
import { supabase } from "../lib/supabase";

type FooterPageSection = {
  id: string;
  heading: string;
  content: string;
};

type FooterPage = {
  title: string;
  intro: string;
  sections: FooterPageSection[];
};

export function PrivacyPolicyPage() {
  const [page, setPage] = useState<FooterPage | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const [settings, navigationResult] = await Promise.all([
        getSettings(),
        supabase
          .from("site_navigation")
          .select("footer_pages")
          .eq("id", 1)
          .maybeSingle(),
      ]);

      if (!mounted) return;

      const saved = navigationResult.data?.footer_pages?.privacy;

      if (saved) {
        setPage(saved);
      } else {
        setPage({
          title: "Privacy Policy",
          intro: "",
          sections: [
            {
              id: "privacy-legacy",
              heading: "",
              content: settings?.privacy_policy || "",
            },
          ],
        });
      }
    }

    load();

    const refresh = () => {
      if (document.visibilityState === "visible") load();
    };

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      mounted = false;
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  if (!page) return null;

  return (
    <div className="container mx-auto py-16 max-w-5xl">
      <h1 className="text-4xl font-bold mb-8">
        {page.title}
      </h1>

      {page.intro && (
        <p className="mb-8 text-gray-700">
          {page.intro}
        </p>
      )}

      <div className="whitespace-pre-wrap leading-8 text-gray-700">
        {page.sections.map((section) => (
          <div key={section.id} className="mb-8">
            {section.heading && (
              <h2 className="font-medium text-lg mb-2">
                {section.heading}
              </h2>
            )}
            <div>{section.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
