import { useEffect, useState } from "react";
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

export function FAQPage() {
  const [page, setPage] = useState<FooterPage | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data: navigationResult } = await supabase
        .from("site_navigation")
        .select("footer_pages")
        .eq("id", 1)
        .maybeSingle();

      if (!mounted) return;

      const saved = navigationResult?.footer_pages?.faq;
      if (saved) {
        setPage(saved);
        return;
      }

      setPage({
        title: "Frequently Asked Questions",
        intro: "",
        sections: [
          {
            id: "faq-1",
            heading: "How long does delivery take?",
            content: "Orders are usually delivered within 1–7 business days depending on your location.",
          },
          {
            id: "faq-2",
            heading: "Do you offer Cash on Delivery?",
            content: "Yes. Cash on Delivery is available in selected locations.",
          },
        ],
      });
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
    <div className="container-custom py-16 min-h-screen">
      <h1 className="text-4xl font-bold mb-8">{page.title}</h1>

      {page.intro && (
        <p className="mb-8 text-gray-600">{page.intro}</p>
      )}

      <div className="space-y-6">
        {page.sections.map((section) => (
          <div key={section.id} className="bg-white rounded-xl shadow p-6">
            <h2 className="font-bold text-lg">{section.heading}</h2>
            <p className="mt-2 text-gray-600 whitespace-pre-wrap">{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
