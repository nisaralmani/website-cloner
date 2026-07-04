import { toBooleanFlag } from "@/lib/auth/flags";
import {
  DEFAULT_SCHEDULE_END,
  DEFAULT_SCHEDULE_START,
  DEFAULT_SCHEDULE_TIMEZONE,
  parseScheduleDays,
  type AvailabilityDay,
  type AvailabilitySchedule,
} from "@/lib/settings/schedule";

type ScheduleUser = {
  scheduleEnabled?: number | boolean | null;
  scheduleDays?: string | null;
  scheduleTimezone?: string | null;
  scheduleStart?: string | null;
  scheduleEnd?: string | null;
};

export function normalizeAvailabilitySchedule(user: ScheduleUser): AvailabilitySchedule {
  return {
    enabled: toBooleanFlag(user.scheduleEnabled),
    days: parseScheduleDays(user.scheduleDays),
    timezone: user.scheduleTimezone?.trim() || DEFAULT_SCHEDULE_TIMEZONE,
    start: user.scheduleStart?.trim() || DEFAULT_SCHEDULE_START,
    end: user.scheduleEnd?.trim() || DEFAULT_SCHEDULE_END,
  };
}

export function isWithinAvailabilitySchedule(
  schedule: AvailabilitySchedule,
  now = new Date(),
) {
  if (!schedule.enabled) {
    return true;
  }

  const dayNames: AvailabilityDay[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = dayNames[now.getDay()];
  if (!today || !schedule.days.includes(today)) {
    return false;
  }

  const minutes = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMinute] = schedule.start.split(":").map(Number);
  const [endHour, endMinute] = schedule.end.split(":").map(Number);
  const startMinutes = startHour! * 60 + startMinute!;
  const endMinutes = endHour! * 60 + endMinute!;

  return minutes >= startMinutes && minutes < endMinutes;
}
