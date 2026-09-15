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

export function ReturnsRefundsPage() {
  const [page, setPage] = useState<FooterPage | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data, error } = await supabase
        .from("site_navigation")
        .select("footer_pages")
        .eq("id", 1)
        .maybeSingle();

      if (!mounted) return;

      if (!error && data?.footer_pages?.returns) {
        setPage(data.footer_pages.returns);
      }
    }

    load();

    const handleRefresh = () => {
      if (document.visibilityState === "visible") load();
    };

    window.addEventListener("focus", load);
    document.addEventListener("visibilitychange", handleRefresh);

    return () => {
      mounted = false;
      window.removeEventListener("focus", load);
      document.removeEventListener("visibilitychange", handleRefresh);
    };
  }, []);

  if (!page) return null;

  return (
    <div className="container mx-auto py-16 max-w-5xl">
      <h1 className="text-4xl font-bold mb-8">
        {page.title}
      </h1>

      <div className="whitespace-pre-wrap leading-8 text-gray-700">
        <p className="mb-8">{page.intro}</p>

        <div className="space-y-6">
          {page.sections.map((section) => (
            <div key={section.id}>
              <p className="whitespace-pre-wrap leading-8 text-gray-700">
                {section.heading}
              </p>
              <p className="whitespace-pre-wrap leading-8 text-gray-700 mt-1">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ReturnsRefundsPage;
