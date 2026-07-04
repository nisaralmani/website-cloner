"use client";

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AVAILABILITY_DAYS,
  SCHEDULE_TIMEZONE_OPTIONS,
  combineScheduleTime,
  parseScheduleTimeParts,
  scheduleLimitLabel,
  type AvailabilityDay,
  type AvailabilitySchedule,
} from "@/lib/settings/schedule";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const MINUTE_OPTIONS = ["00", "15", "30", "45"];

type AvailabilityScheduleFieldsProps = {
  schedule: AvailabilitySchedule | null;
  disabled: boolean;
  saving?: boolean;
  onPatch: (patch: Partial<AvailabilitySchedule>) => Promise<boolean>;
};

export function AvailabilityDayTabs({
  schedule,
  disabled,
  saving,
  onPatch,
}: AvailabilityScheduleFieldsProps) {
  if (!schedule) return null;

  const toggleDay = (day: AvailabilityDay) => {
    if (disabled || saving) return;

    const next = schedule.days.includes(day)
      ? schedule.days.filter((value) => value !== day)
      : [...schedule.days, day];

    if (next.length === 0) return;
    void onPatch({ days: next.sort((a, b) => AVAILABILITY_DAYS.indexOf(a) - AVAILABILITY_DAYS.indexOf(b)) });
  };

  return (
    <div className={cn("w-full", disabled && "opacity-60")}>
      <label className="mb-2 block text-sm font-bold text-[#606976]">
        Days
        <span className="ml-1 font-bold text-[#606976]">{scheduleLimitLabel(schedule.days)}</span>
      </label>
      <div className="flex flex-wrap gap-1">
        {AVAILABILITY_DAYS.map((day) => {
          const active = schedule.days.includes(day);
          return (
            <button
              key={day}
              type="button"
              disabled={disabled || saving}
              onClick={() => toggleDay(day)}
              className={cn(
                "inline-flex min-w-[44px] items-center justify-center rounded px-3 py-1.5 text-sm font-bold",
                active ? "bg-[#1972F5] text-white" : "bg-[#F4F4F5] text-[#8d949d]",
                !disabled && !saving && "hover:opacity-90",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AvailabilityTimezoneSelect({
  schedule,
  disabled,
  saving,
  onPatch,
}: AvailabilityScheduleFieldsProps) {
  if (!schedule) return null;

  return (
    <div className={cn("flex w-full items-center", disabled && "opacity-60")}>
      <label className="w-[140px] shrink-0 pr-10 text-sm font-bold text-[#606976]">Timezone</label>
      <div className="relative min-w-0" style={{ width: 340 }}>
        <select
          value={schedule.timezone}
          disabled={disabled || saving}
          onChange={(event) => void onPatch({ timezone: event.target.value })}
          className="flex h-10 w-full appearance-none rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 text-sm font-bold text-[#1c293b] outline-none"
        >
          {SCHEDULE_TIMEZONE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#828ea1]"
        />
      </div>
    </div>
  );
}

export function AvailabilityHoursRow({
  schedule,
  disabled,
  saving,
  onPatch,
}: AvailabilityScheduleFieldsProps) {
  if (!schedule) return null;

  const start = parseScheduleTimeParts(schedule.start);
  const end = parseScheduleTimeParts(schedule.end);

  const updateStart = (hour: string, minute: string) => {
    void onPatch({ start: combineScheduleTime(hour, minute) });
  };

  const updateEnd = (hour: string, minute: string) => {
    void onPatch({ end: combineScheduleTime(hour, minute) });
  };

  const selectClassName =
    "flex h-8 w-[52px] appearance-none rounded border border-[#E8EAEB] bg-[#F8F9F9] px-2 text-sm font-bold text-[#1c293b] outline-none";

  return (
    <div className={cn("flex w-full items-center gap-3", disabled && "opacity-60")}>
      <label className="w-[140px] shrink-0 pr-6 text-sm font-bold text-[#606976]">Hours</label>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <select
          value={start.hour}
          disabled={disabled || saving}
          onChange={(event) => updateStart(event.target.value, start.minute)}
          className={selectClassName}
        >
          {HOUR_OPTIONS.map((hour) => (
            <option key={hour} value={hour}>
              {hour}
            </option>
          ))}
        </select>
        <select
          value={start.minute}
          disabled={disabled || saving}
          onChange={(event) => updateStart(start.hour, event.target.value)}
          className={selectClassName}
        >
          {MINUTE_OPTIONS.map((minute) => (
            <option key={minute} value={minute}>
              {minute}
            </option>
          ))}
        </select>
        <span className="text-sm font-bold text-[#8d949d]">—</span>
        <select
          value={end.hour}
          disabled={disabled || saving}
          onChange={(event) => updateEnd(event.target.value, end.minute)}
          className={selectClassName}
        >
          {HOUR_OPTIONS.map((hour) => (
            <option key={hour} value={hour}>
              {hour}
            </option>
          ))}
        </select>
        <select
          value={end.minute}
          disabled={disabled || saving}
          onChange={(event) => updateEnd(end.hour, event.target.value)}
          className={selectClassName}
        >
          {MINUTE_OPTIONS.map((minute) => (
            <option key={minute} value={minute}>
              {minute}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function useAvailabilityScheduleFields(
  schedule: AvailabilitySchedule | null,
  setSchedule: Dispatch<SetStateAction<AvailabilitySchedule | null>>,
  setError: Dispatch<SetStateAction<string | null>>,
  setSaving: Dispatch<SetStateAction<boolean>>,
) {
  const onPatch = useCallback(
    async (patch: Partial<AvailabilitySchedule>) => {
      if (!schedule) return false;

      const previous = schedule;
      setSchedule({ ...schedule, ...patch });
      setSaving(true);
      setError(null);

      try {
        const response = await fetch("/api/auth/availability-schedule", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!response.ok) {
          throw new Error("Failed to save schedule");
        }

        const data = (await response.json()) as { schedule: AvailabilitySchedule };
        setSchedule(data.schedule);
        return true;
      } catch {
        setSchedule(previous);
        setError("Unable to save availability schedule.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [schedule, setError, setSaving, setSchedule],
  );

  return onPatch;
}

export function useAvailabilitySchedule(enabled: boolean, scheduleEnabled: boolean) {
  const [schedule, setSchedule] = useState<AvailabilitySchedule | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setSchedule(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const response = await fetch("/api/auth/availability-schedule");
        if (!response.ok) {
          throw new Error("Failed to load schedule");
        }
        const data = (await response.json()) as { schedule: AvailabilitySchedule };
        if (!cancelled) {
          setSchedule(data.schedule);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load availability schedule.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, scheduleEnabled]);

  const onPatch = useAvailabilityScheduleFields(schedule, setSchedule, setError, setSaving);

  return {
    schedule,
    loading,
    error,
    saving,
    fieldsDisabled: !scheduleEnabled,
    onPatch,
  };
}
