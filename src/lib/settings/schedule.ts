export const AVAILABILITY_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type AvailabilityDay = (typeof AVAILABILITY_DAYS)[number];

export type AvailabilitySchedule = {
  enabled: boolean;
  days: AvailabilityDay[];
  timezone: string;
  start: string;
  end: string;
};

export const DEFAULT_SCHEDULE_DAYS: AvailabilityDay[] = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

export const DEFAULT_SCHEDULE_TIMEZONE = "UTC+05:00";
export const DEFAULT_SCHEDULE_START = "09:00";
export const DEFAULT_SCHEDULE_END = "17:00";

export const SCHEDULE_TIMEZONE_OPTIONS = [
  "UTC-08:00",
  "UTC-05:00",
  "UTC+00:00",
  "UTC+01:00",
  "UTC+05:00",
  "UTC+08:00",
] as const;

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseScheduleDays(raw: string | null | undefined): AvailabilityDay[] {
  if (!raw) return [...DEFAULT_SCHEDULE_DAYS];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...DEFAULT_SCHEDULE_DAYS];

    const days = parsed.filter(
      (day): day is AvailabilityDay =>
        typeof day === "string" && AVAILABILITY_DAYS.includes(day as AvailabilityDay),
    );

    return days.length > 0 ? days : [...DEFAULT_SCHEDULE_DAYS];
  } catch {
    return [...DEFAULT_SCHEDULE_DAYS];
  }
}

export function serializeScheduleDays(days: AvailabilityDay[]) {
  return JSON.stringify(days);
}

export function normalizeScheduleTime(value: string, fallback: string) {
  const trimmed = value.trim();
  return TIME_PATTERN.test(trimmed) ? trimmed : fallback;
}

export function parseScheduleTimeParts(value: string) {
  const normalized = normalizeScheduleTime(value, "00:00");
  const [hour, minute] = normalized.split(":");
  return { hour: hour!, minute: minute! };
}

export function combineScheduleTime(hour: string, minute: string) {
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

export function validateSchedulePatch(patch: Partial<AvailabilitySchedule>) {
  const errors: string[] = [];

  if (patch.days !== undefined && patch.days.length === 0) {
    errors.push("At least one day is required");
  }

  if (patch.timezone !== undefined && !(SCHEDULE_TIMEZONE_OPTIONS as readonly string[]).includes(patch.timezone)) {
    errors.push("timezone is invalid");
  }

  if (patch.start !== undefined && !TIME_PATTERN.test(patch.start)) {
    errors.push("start must be HH:MM");
  }

  if (patch.end !== undefined && !TIME_PATTERN.test(patch.end)) {
    errors.push("end must be HH:MM");
  }

  if (
    patch.start !== undefined &&
    patch.end !== undefined &&
    patch.start >= patch.end
  ) {
    errors.push("end must be after start");
  }

  return errors;
}

export function scheduleLimitLabel(days: AvailabilityDay[]) {
  return `(${days.length}/7)`;
}
