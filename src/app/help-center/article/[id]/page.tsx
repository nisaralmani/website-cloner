import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import MarketingShell from "@/components/marketing/MarketingShell";
import { HelpCenterArticleFeedback } from "@/components/help-center/HelpCenterArticleFeedback";
import { MarketingSection } from "@/components/marketing/marketing-ui";
import { helpArticleUrl, PUBLIC_HELP_CENTER_URL } from "@/lib/docs-links";
import {
  publicHelpdeskArticleUrl,
  publicHelpdeskListUrl,
} from "@/lib/public-helpdesk";
import type { HelpdeskArticle } from "@/types/helpdesk";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function getRequestOrigin() {
  const headerStore = await headers();
  const rawHost = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  let host = rawHost;
  const proto = headerStore.get("x-forwarded-proto") ?? "http";

  const cleanHost = host.split(":")[0] || "";
  if (
    cleanHost === "localhost" ||
    cleanHost === "127.0.0.1" ||
    cleanHost.endsWith("bybelt.com")
  ) {
    const port = process.env.PORT || host.split(":")[1] || "3000";
    host = `127.0.0.1:${port}`;
  }

  const result = `${proto}://${host}`;
  console.log(`[getRequestOrigin] hostHeader="${headerStore.get("host")}" xForwardedHost="${headerStore.get("x-forwarded-host")}" cleanHost="${cleanHost}" process.env.PORT="${process.env.PORT}" resolved="${result}"`);
  return result;
}

async function loadArticle(id: string): Promise<HelpdeskArticle | null> {
  const origin = await getRequestOrigin();
  const response = await fetch(publicHelpdeskArticleUrl(origin, id), {
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) return null;
  const data = (await response.json()) as { article?: HelpdeskArticle };
  return data.article ?? null;
}

async function loadRelatedArticles(excludeId: string): Promise<HelpdeskArticle[]> {
  const origin = await getRequestOrigin();
  const response = await fetch(publicHelpdeskListUrl(origin), { cache: "no-store" });
  if (!response.ok) return [];
  const data = (await response.json()) as { articles?: HelpdeskArticle[] };
  return (data.articles ?? []).filter((article) => article.id !== excludeId).slice(0, 4);
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const article = await loadArticle(id);
  if (!article) {
    return { title: "Article not found | Bybelt Help Center" };
  }
  return {
    title: `${article.title} | Bybelt Help Center`,
    description: article.body?.slice(0, 160) ?? "Bybelt help article",
    alternates: {
      canonical: helpArticleUrl(id),
    },
  };
}

export default async function HelpCenterArticlePage({ params }: PageProps) {
  const { id } = await params;
  const article = await loadArticle(id);
  if (!article) {
    notFound();
  }
  const related = await loadRelatedArticles(id);

  return (
    <MarketingShell>
      <MarketingSection variant="white">
        <div className="mx-auto max-w-3xl">
          <Link
            href={PUBLIC_HELP_CENTER_URL}
            className="text-sm font-semibold text-[#1972F5] hover:underline"
          >
            ← Back to Help Center
          </Link>
          <h1 className="mt-6 text-[2rem] font-medium tracking-[-0.02em] text-[#0f172a]">
            {article.title}
          </h1>
          <p className="mt-2 text-sm text-[#64748b]">
            {article.views} views · Updated {article.lastUpdate}
          </p>
          <article className="prose prose-slate mt-8 max-w-none text-[15px] leading-7 text-[#334155]">
            {article.body?.split("\n").map((paragraph, index) => (
              <p key={`${index}-${paragraph.slice(0, 12)}`}>{paragraph}</p>
            ))}
          </article>

          <HelpCenterArticleFeedback
            articleId={article.id}
            initialHelpfulCount={article.helpfulCount}
          />

          {related.length > 0 ? (
            <div className="mt-10">
              <h2 className="text-lg font-semibold text-[#0f172a]">Related articles</h2>
              <ul className="mt-4 space-y-2">
                {related.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={helpArticleUrl(item.id)}
                      className="text-sm font-semibold text-[#1972F5] hover:underline"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </MarketingSection>
    </MarketingShell>
  );
}
