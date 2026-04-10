import { createClient } from "@/utils/supabase/server";
import TimecardClient from "./_components/TimecardClient";

function getDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type TimecardRow = {
  id: string;
  staff_name: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  break_minutes: number;
  notes: string;
};

export default async function TimecardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const today = new Date();
  const todayStr = getDateStr(today);
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const selectedMonth = monthParam || defaultMonth;

  const [y, m] = selectedMonth.split("-").map(Number);
  const monthStart = `${y}-${String(m).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const monthEnd = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const availableMonths = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  let timecards: TimecardRow[] = [];
  let currentUserName = "";

  try {
    const supabase = await createClient();
    const [{ data: { user } }, { data: tc }] = await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("timecards")
        .select("id, staff_name, date, clock_in, clock_out, break_minutes, notes")
        .gte("date", monthStart)
        .lte("date", monthEnd)
        .order("date", { ascending: false })
        .order("staff_name", { ascending: true }),
    ]);

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();
      currentUserName = (profile as { name?: string } | null)?.name || user.email?.split("@")[0] || "";
    }

    timecards = (tc ?? []) as TimecardRow[];
  } catch {
    // DB unavailable
  }

  return (
    <TimecardClient
      timecards={timecards}
      currentMonth={selectedMonth}
      availableMonths={availableMonths}
      todayStr={todayStr}
      currentUserName={currentUserName}
    />
  );
}
