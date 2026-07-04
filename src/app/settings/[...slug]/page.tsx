import { notFound } from "next/navigation";
import SettingsShell from "@/components/settings/SettingsShell";
import SettingsDetail from "@/components/settings/SettingsDetail";
import { getPageConfig, allSlugs } from "@/lib/settings-data";

export function generateStaticParams() {
  return allSlugs().map((slug) => ({ slug: slug.split("/") }));
}

export default async function SettingsDetailPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const config = getPageConfig(slug.join("/"));
  if (!config) notFound();

  return (
    <SettingsShell breadcrumb={config.breadcrumb}>
      <SettingsDetail config={config} pageSlug={slug.join("/")} />
    </SettingsShell>
  );
}
