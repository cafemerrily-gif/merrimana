import { createClient } from "@/utils/supabase/server";
import { getCurrentPeriod, getPeriodKey } from "./shift/_lib/periods";
import DailyReportForm from "./_components/DailyReportForm";

const WEEK_DAYS = ["月", "火", "水", "木", "金", "土", "日"];

function jsDowToMyDow(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

function getDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function StorePage() {
  const today = new Date();
  const todayStr = getDateStr(today);
  const todayDow = jsDowToMyDow(today.getDay());

  const period = getCurrentPeriod(today);
  const periodKey = getPeriodKey(period);

  type ShiftEntry = { id: string; staff_name: string; start_time: string; end_time: string; notes: string };
  type TimecardEntry = { staff_name: string; clock_in: string | null };
  type DailyReport = { content: string; submitted_by: string } | null;

  let todayShifts: ShiftEntry[] = [];
  let timecards: TimecardEntry[] = [];
  let dailyReport: DailyReport = null;
  let currentUserName = "";

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const [shiftsRes, timecardsRes, reportRes, profileRes] = await Promise.all([
      supabase
        .from("weekly_shifts")
        .select("id, staff_name, start_time, end_time, notes")
        .eq("period_key", periodKey)
        .eq("day_of_week", todayDow)
        .order("start_time", { ascending: true }),
      supabase
        .from("timecards")
        .select("staff_name, clock_in")
        .eq("date", todayStr),
      supabase
        .from("daily_reports")
        .select("content, submitted_by")
        .eq("date", todayStr)
        .maybeSingle(),
      user
        ? supabase.from("profiles").select("name").eq("id", user.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    todayShifts = (shiftsRes.data ?? []) as ShiftEntry[];
    timecards   = (timecardsRes.data ?? []) as TimecardEntry[];
    dailyReport = (reportRes.data ?? null) as DailyReport;
    currentUserName = (profileRes.data as { name?: string } | null)?.name ?? "";
  } catch {
    // DB unavailable
  }

  // タイムカード情報を staff_name でインデックス化
  const timecardMap: Record<string, TimecardEntry> = {};
  for (const t of timecards) {
    timecardMap[t.staff_name] = t;
  }

  const dayLabel = `${today.getMonth() + 1}月${today.getDate()}日（${WEEK_DAYS[todayDow]}）`;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">日報</h1>
        <p className="text-sm text-neutral-500 mt-0.5">{dayLabel}</p>
      </div>

      {/* 本日のシフト */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            本日のシフト
          </h2>
        </div>
        {todayShifts.length === 0 ? (
          <p className="text-sm text-neutral-400 px-4 py-5 text-center">
            本日のシフト登録がありません
          </p>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {todayShifts.map((s) => {
              const tc = timecardMap[s.staff_name];
              const clockedIn = !!tc?.clock_in;
              return (
                <div key={s.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {s.staff_name}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {s.start_time}〜{s.end_time}
                      {s.notes && ` · ${s.notes}`}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      clockedIn
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
                    }`}
                  >
                    {clockedIn ? "出勤済" : "未出勤"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 本日の報告 */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            本日の報告
          </h2>
        </div>
        <div className="p-4">
          <DailyReportForm
            date={todayStr}
            existingContent={dailyReport?.content ?? null}
            submittedBy={dailyReport?.submitted_by ?? null}
            currentUserName={currentUserName}
          />
        </div>
      </div>
    </div>
  );
}
