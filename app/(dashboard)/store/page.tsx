import { createClient } from "@/utils/supabase/server";
import { getCurrentPeriod, getPeriodKey } from "./shift/_lib/periods";
import DailyReportForm from "./_components/DailyReportForm";
import DateNav from "./_components/DateNav";

const WEEK_DAYS = ["月", "火", "水", "木", "金", "土", "日"];

// JS の getDay() (0=日, ...) → 内部連番 (0=月, ..., 6=日)
function jsDowToMyDow(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

// Vercel は UTC 動作のため JST (UTC+9) でのローカル日付を返す
function getJstDateStr(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// "YYYY-MM-DD" 文字列から曜日を求める（タイムゾーン非依存）
function dowFromDateStr(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return jsDowToMyDow(new Date(y, m - 1, d).getDay());
}

// "YYYY-MM-DD" → "M月D日（曜）" 表示
function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = jsDowToMyDow(new Date(y, m - 1, d).getDay());
  return `${y}年${m}月${d}日（${WEEK_DAYS[dow]}）`;
}

// 与えられた日付が有効な "YYYY-MM-DD" かチェック
function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime());
}

export default async function StorePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const todayStr = getJstDateStr();

  // 未来日は今日に丸める。無効値も今日にフォールバック
  const selectedDate =
    dateParam && isValidDate(dateParam) && dateParam <= todayStr
      ? dateParam
      : todayStr;

  const selectedDow = dowFromDateStr(selectedDate);
  const period = getCurrentPeriod(new Date(selectedDate + "T00:00:00"));
  const periodKey = getPeriodKey(period);

  type ShiftEntry = { id: string; staff_name: string; start_time: string; end_time: string; notes: string };
  type TimecardEntry = { staff_name: string; clock_in: string | null };
  type DailyReport = { content: string; submitted_by: string } | null;

  let dayShifts: ShiftEntry[] = [];
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
        .eq("day_of_week", selectedDow)
        .order("start_time", { ascending: true }),
      supabase
        .from("timecards")
        .select("staff_name, clock_in")
        .eq("date", selectedDate),
      supabase
        .from("daily_reports")
        .select("content, submitted_by")
        .eq("date", selectedDate)
        .maybeSingle(),
      user
        ? supabase.from("profiles").select("name").eq("id", user.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    dayShifts       = (shiftsRes.data ?? []) as ShiftEntry[];
    timecards       = (timecardsRes.data ?? []) as TimecardEntry[];
    dailyReport     = (reportRes.data ?? null) as DailyReport;
    currentUserName = (profileRes.data as { name?: string } | null)?.name ?? "";
  } catch {
    // DB unavailable
  }

  const timecardMap: Record<string, TimecardEntry> = {};
  for (const t of timecards) timecardMap[t.staff_name] = t;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ヘッダー + 日付ナビ */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">日報</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{formatDateLabel(selectedDate)}</p>
        </div>
        <DateNav dateStr={selectedDate} todayStr={todayStr} />
      </div>

      {/* シフト */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            {selectedDate === todayStr ? "本日のシフト" : "この日のシフト"}
          </h2>
        </div>
        {dayShifts.length === 0 ? (
          <p className="text-sm text-neutral-400 px-4 py-5 text-center">
            シフト登録がありません
          </p>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {dayShifts.map((s) => {
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

      {/* 日報フォーム */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            {selectedDate === todayStr ? "本日の報告" : "この日の報告"}
          </h2>
        </div>
        <div className="p-4">
          <DailyReportForm
            date={selectedDate}
            existingContent={dailyReport?.content ?? null}
            submittedBy={dailyReport?.submitted_by ?? null}
            currentUserName={currentUserName}
          />
        </div>
      </div>
    </div>
  );
}
