export const AVAILABILITY_PAGE_SLUG = "account/availability";

/** Toggle index for "Force offline (invisible mode)" on the availability page. */
export const AVAILABILITY_FORCE_OFFLINE_KEY = "0-0";

/** Toggle index for "Set me available when using the app". */
export const AVAILABILITY_AUTO_AVAILABLE_KEY = "0-1";

/** Toggle index for "Enable availability schedule". */
export const AVAILABILITY_SCHEDULE_ENABLED_KEY = "0-2";

export function isAvailabilityPage(pageSlug: string) {
  return pageSlug === AVAILABILITY_PAGE_SLUG;
}

export function forceOfflineFromPresence(presence: "online" | "offline") {
  return presence === "offline";
}

export function presenceFromForceOffline(on: boolean): "online" | "offline" {
  return on ? "offline" : "online";
}

export function presenceBannerLabel(presence: "online" | "offline") {
  return presence === "online" ? "Online" : "Offline";
}

export function isAvailabilityPresenceKey(localKey: string) {
  return (
    localKey === AVAILABILITY_FORCE_OFFLINE_KEY ||
    localKey === AVAILABILITY_AUTO_AVAILABLE_KEY ||
    localKey === AVAILABILITY_SCHEDULE_ENABLED_KEY
  );
}
