import { createClient } from "@/utils/supabase/server";
import { requirePermission } from "@/utils/permissions";
import ShiftClient from "./_components/ShiftClient";
import {
  type WeeklyShiftRow,
  type Period,
  getCurrentPeriod,
  getPeriodKey,
  parsePeriodKey,
} from "./_lib/periods";

export type { WeeklyShiftRow, Period };
export { getPeriodKey, parsePeriodKey };

export default async function ShiftPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requirePermission("view_store");
  const { period: periodParam } = await searchParams;
  const today = new Date();

  const defaultPeriod = getCurrentPeriod(today);
  const period = (periodParam ? parsePeriodKey(periodParam) : null) ?? defaultPeriod;
  const currentKey = getPeriodKey(period);

  const prevPeriod: Period =
    period.half === 1
      ? { year: period.year - 1, half: 2 }
      : { year: period.year, half: 1 };
  const nextPeriod: Period =
    period.half === 1
      ? { year: period.year, half: 2 }
      : { year: period.year + 1, half: 1 };
  const availablePeriods = [prevPeriod, period, nextPeriod];

  let weeklyShifts: WeeklyShiftRow[] = [];
  let staffList: string[] = [];

  try {
    const supabase = await createClient();

    const [{ data: shiftsData }, { data: profilesData }] = await Promise.all([
      supabase
        .from("weekly_shifts")
        .select("id, period_key, day_of_week, staff_name, start_time, end_time, notes")
        .eq("period_key", currentKey)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true }),
      supabase
        .from("profiles")
        .select("name")
        .order("name"),
    ]);

    weeklyShifts = (shiftsData ?? []) as WeeklyShiftRow[];
    staffList = ((profilesData ?? []) as { name: string }[])
      .map((p) => p.name)
      .filter(Boolean);
  } catch {
    // DB unavailable
  }

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <ShiftClient
      weeklyShifts={weeklyShifts}
      staffList={staffList}
      currentPeriodKey={currentKey}
      availablePeriodKeys={availablePeriods.map(getPeriodKey)}
      todayStr={todayStr}
    />
  );
}
