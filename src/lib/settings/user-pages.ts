/** Account settings pages whose toggles are stored per user (not per workspace). */
export const USER_TOGGLE_SETTINGS_PAGES = new Set([
  "account/notifications",
  "account/shortcuts",
]);

/** Account settings pages whose select fields are stored per user. */
export const USER_FIELD_SETTINGS_PAGE = "account/interface";

export function isUserToggleSettingsPage(pageSlug: string) {
  return USER_TOGGLE_SETTINGS_PAGES.has(pageSlug);
}

export function isUserFieldSettingsPage(pageSlug: string) {
  return pageSlug === USER_FIELD_SETTINGS_PAGE;
}

export function isUserSettingsPage(pageSlug: string) {
  return isUserToggleSettingsPage(pageSlug) || isUserFieldSettingsPage(pageSlug);
}
