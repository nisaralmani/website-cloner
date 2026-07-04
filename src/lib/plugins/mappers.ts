import type { Plugin, PluginBadge } from "@/types/plugins";
import type { pluginCatalog } from "@/db/schema";

type CatalogRow = typeof pluginCatalog.$inferSelect;

const BADGES = new Set<PluginBadge>(["Essentials", "Mini", "Plus", "Free"]);

export function toPlugin(row: CatalogRow, installed: boolean): Plugin {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    iconUrl: row.iconUrl,
    category: row.category,
    badge: row.badge && BADGES.has(row.badge as PluginBadge)
      ? (row.badge as PluginBadge)
      : undefined,
    price: row.price ?? undefined,
    separateCheckout: row.separateCheckout === 1,
    installed,
  };
}
