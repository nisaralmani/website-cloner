import { appPluginsPath } from "@/lib/marketing-paths";

export type PluginFilter = "all" | "installed";

export const PLUGIN_CATEGORIES = [
  { id: "bybelt-features", label: "Bybelt Features", count: 31 },
  { id: "automation", label: "Automation", count: 20 },
  { id: "cms", label: "CMS", count: 10 },
  { id: "crm", label: "CRM", count: 7 },
  { id: "marketing", label: "Marketing", count: 7 },
  { id: "messaging", label: "Messaging", count: 13 },
  { id: "teamwork", label: "Teamwork", count: 11 },
  { id: "others", label: "Others", count: 17 },
] as const;

export { appPluginsPath };

export function pluginFilterFromParams(
  filter: string | null,
  installed: string | null,
): PluginFilter {
  if (filter === "installed" || installed === "1") return "installed";
  return "all";
}

export function pluginCategoryFromParams(category: string | null): string | null {
  if (!category) return null;
  const valid = PLUGIN_CATEGORIES.some((item) => item.id === category);
  return valid ? category : null;
}
