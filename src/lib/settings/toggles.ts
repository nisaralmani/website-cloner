import type { PageConfig } from "@/lib/settings-data";

export function toggleLocalKey(sectionIndex: number, itemIndex: number): string {
  return `${sectionIndex}-${itemIndex}`;
}

export function toggleSettingKey(pageSlug: string, localKey: string): string {
  return `${pageSlug}::${localKey}`;
}

export function parseToggleSettingKey(settingKey: string): {
  pageSlug: string;
  localKey: string;
} | null {
  const separator = settingKey.indexOf("::");
  if (separator === -1) return null;
  return {
    pageSlug: settingKey.slice(0, separator),
    localKey: settingKey.slice(separator + 2),
  };
}

export function extractDefaultToggles(config: PageConfig): Record<string, boolean> {
  const initial: Record<string, boolean> = {};
  config.sections.forEach((section, sectionIndex) => {
    section.items.forEach((item, itemIndex) => {
      if (item.kind === "toggle") {
        initial[toggleLocalKey(sectionIndex, itemIndex)] = !!item.on;
      }
    });
  });
  return initial;
}
