/** Local toggle keys for `/settings/account/shortcuts` (sectionIndex-itemIndex). */
export const SHORTCUT_TOGGLE_KEYS = {
  search: "0-0",
  commandPalette: "0-1",
  editorActions: "1-0",
} as const;

export type ShortcutPreferenceKey = keyof typeof SHORTCUT_TOGGLE_KEYS;

export type ShortcutPreferences = Record<ShortcutPreferenceKey, boolean>;

export const DEFAULT_SHORTCUT_PREFERENCES: ShortcutPreferences = {
  search: true,
  commandPalette: true,
  editorActions: true,
};

export function shortcutPreferencesFromToggles(
  toggles: Record<string, boolean>,
): ShortcutPreferences {
  return {
    search: toggles[SHORTCUT_TOGGLE_KEYS.search] ?? DEFAULT_SHORTCUT_PREFERENCES.search,
    commandPalette:
      toggles[SHORTCUT_TOGGLE_KEYS.commandPalette] ??
      DEFAULT_SHORTCUT_PREFERENCES.commandPalette,
    editorActions:
      toggles[SHORTCUT_TOGGLE_KEYS.editorActions] ?? DEFAULT_SHORTCUT_PREFERENCES.editorActions,
  };
}
