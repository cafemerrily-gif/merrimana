import { createClient } from "@/utils/supabase/server";
import ShiftClient from "./_components/ShiftClient";
import {
  type ShiftRow,
  type Period,
  getCurrentPeriod,
  getPeriodRange,
  getPeriodKey,
  parsePeriodKey,
} from "./_lib/periods";

function getDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type { ShiftRow, Period };
export { getPeriodRange, getPeriodKey, parsePeriodKey };

export default async function ShiftPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const today = new Date();
  const todayStr = getDateStr(today);

  const defaultPeriod = getCurrentPeriod(today);
  const period = (periodParam ? parsePeriodKey(periodParam) : null) ?? defaultPeriod;
  const { start, end } = getPeriodRange(period);

  const prevPeriod: Period =
    period.half === 1
      ? { year: period.year - 1, half: 2 }
      : { year: period.year, half: 1 };
  const nextPeriod: Period =
    period.half === 1
      ? { year: period.year, half: 2 }
      : { year: period.year + 1, half: 1 };
  const availablePeriods = [prevPeriod, period, nextPeriod];

  let shifts: ShiftRow[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("shifts")
      .select("id, staff_name, role, date, start_time, end_time, notes")
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });
    shifts = (data ?? []) as ShiftRow[];
  } catch {
    // DB unavailable
  }

  return (
    <ShiftClient
      shifts={shifts}
      currentPeriodKey={getPeriodKey(period)}
      availablePeriodKeys={availablePeriods.map(getPeriodKey)}
      todayStr={todayStr}
    />
  );
}
