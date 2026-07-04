import type { OperatorPresence } from "@/lib/auth/presence";
import { toBooleanFlag } from "@/lib/auth/flags";
import { isWithinAvailabilitySchedule, normalizeAvailabilitySchedule } from "@/lib/auth/schedule";

type AvailabilityUser = {
  forceOffline: number | boolean | null | undefined;
  autoAvailable: number | boolean | null | undefined;
  scheduleEnabled?: number | boolean | null;
  scheduleDays?: string | null;
  scheduleTimezone?: string | null;
  scheduleStart?: string | null;
  scheduleEnd?: string | null;
};

export function presenceForAppActivity(
  user: AvailabilityUser,
  active: boolean,
): OperatorPresence | null {
  if (toBooleanFlag(user.forceOffline)) {
    return "offline";
  }
  if (!toBooleanFlag(user.autoAvailable)) {
    return null;
  }
  if (!active) {
    return "offline";
  }

  const schedule = normalizeAvailabilitySchedule(user);
  if (!isWithinAvailabilitySchedule(schedule)) {
    return "offline";
  }

  return "online";
}