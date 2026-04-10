import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { TrendingUp, TrendingDown } from "lucide-react";

const CALENDAR_DAYS = ["月", "火", "水", "木", "金", "土", "日"];
const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
const WEATHER_ICON: Record<string, string> = {
  晴れ: "☀️", 曇り: "☁️", 雨: "🌧", 雪: "❄️", 嵐: "⛈",
};

function getDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getWeekStartDate(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const result = new Date(d);
  result.setDate(d.getDate() - diff);
  return result;
}

function sumAmount(sales: { amount: number }[]) {
  return sales.reduce((s, r) => s + r.amount, 0);
}

function avgUnitPrice(sales: { amount: number; customer_count: number }[]) {
  const totalAmount = sumAmount(sales);
  const totalCustomers = sales.reduce((s, r) => s + r.customer_count, 0);
  return totalCustomers > 0 ? Math.round(totalAmount / totalCustomers) : 0;
}

function changePct(current: number, prev: number) {
  if (prev === 0) return { label: "-", up: true, neutral: true };
  const diff = ((current - prev) / prev) * 100;
  return {
    label: `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`,
    up: diff >= 0,
    neutral: false,
  };
}

function fmt(n: number) {
  return `¥${n.toLocaleString()}`;
}

function KpiCard({
  label,
  value,
  change,
  sub,
}: {
  label: string;
  value: string;
  change: { label: string; up: boolean; neutral: boolean };
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      <p className="text-xs text-neutral-400 mb-1">{label}</p>
      <p className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
        {value}
      </p>
      <div className="flex items-center gap-1 mt-1">
        {!change.neutral &&
          (change.up ? (
            <TrendingUp size={12} className="text-blue-500 shrink-0" />
          ) : (
            <TrendingDown size={12} className="text-red-400 shrink-0" />
          ))}
        <p
          className={`text-xs font-medium ${
            change.neutral
              ? "text-neutral-400"
              : change.up
              ? "text-blue-500"
              : "text-red-400"
          }`}
        >
          {change.label} {sub}
        </p>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const today = new Date();
  const todayStr = getDateStr(today);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = getDateStr(yesterday);

  // Week
  const weekStart = getWeekStartDate(today);
  const weekStartStr = getDateStr(weekStart);
  const lastWeekEnd = new Date(weekStart);
  lastWeekEnd.setDate(weekStart.getDate() - 1);
  const lastWeekStart = getWeekStartDate(lastWeekEnd);
  const lastWeekStartStr = getDateStr(lastWeekStart);
  const lastWeekEndStr = getDateStr(lastWeekEnd);

  // Month
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const monthStartStr = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastMonthYear = month === 1 ? year - 1 : year;
  const lastMonth = month === 1 ? 12 : month - 1;
  const lastMonthStartStr = `${lastMonthYear}-${String(lastMonth).padStart(2, "0")}-01`;
  const lastMonthEndStr = getDateStr(new Date(year, month - 1, 0));

  type SaleRow = { date: string; amount: number; customer_count: number };
  type RecentSaleRow = {
    id: string;
    date: string;
    time_slot: string | null;
    weather: string | null;
    amount: number;
    customer_count: number;
  };

  let salesThisMonth: SaleRow[] = [];
  let salesLastMonth: SaleRow[] = [];
  let salesLastWeek: { date: string; amount: number }[] = [];
  let expensesThisMonth = 0;
  let expensesLastMonth = 0;
  let recentSales: RecentSaleRow[] = [];

  try {
    const supabase = await createClient();
    const [d1, d2, d3, d4, d5, d6] = await Promise.all([
      supabase
        .from("sales")
        .select("date, amount, customer_count")
        .gte("date", monthStartStr)
        .lte("date", todayStr),
      supabase
        .from("sales")
        .select("date, amount, customer_count")
        .gte("date", lastMonthStartStr)
        .lte("date", lastMonthEndStr),
      supabase
        .from("sales")
        .select("date, amount")
        .gte("date", lastWeekStartStr)
        .lte("date", lastWeekEndStr),
      supabase
        .from("expenses")
        .select("amount")
        .gte("date", monthStartStr)
        .lte("date", todayStr),
      supabase
        .from("expenses")
        .select("amount")
        .gte("date", lastMonthStartStr)
        .lte("date", lastMonthEndStr),
      supabase
        .from("sales")
        .select("id, date, time_slot, weather, amount, customer_count")
        .order("date", { ascending: false })
        .limit(5),
    ]);

    salesThisMonth = (d1.data ?? []) as SaleRow[];
    salesLastMonth = (d2.data ?? []) as SaleRow[];
    salesLastWeek = d3.data ?? [];
    expensesThisMonth = (d4.data ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0);
    expensesLastMonth = (d5.data ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0);
    recentSales = (d6.data ?? []) as RecentSaleRow[];
  } catch {
    // DB unavailable — show zeros
  }

  // KPI calculations
  const todaySales = salesThisMonth.filter((s) => s.date === todayStr);
  const yesterdayInThisMonth = salesThisMonth.filter((s) => s.date === yesterdayStr);
  const yesterdayInLastMonth = salesLastMonth.filter((s) => s.date === yesterdayStr);
  const yesterdaySales = [...yesterdayInThisMonth, ...yesterdayInLastMonth];

  // This week: from weekStart to today (may span months)
  const thisWeekSales = [
    ...salesThisMonth.filter((s) => s.date >= weekStartStr),
    ...salesLastMonth.filter((s) => s.date >= weekStartStr && s.date <= lastMonthEndStr),
  ];

  const todayAmount = sumAmount(todaySales);
  const yesterdayAmount = sumAmount(yesterdaySales);
  const thisWeekAmount = sumAmount(thisWeekSales);
  const lastWeekAmount = sumAmount(salesLastWeek);
  const thisMonthAmount = sumAmount(salesThisMonth);
  const lastMonthAmount = sumAmount(salesLastMonth);
  const thisMonthUnitPrice = avgUnitPrice(salesThisMonth);
  const lastMonthUnitPrice = avgUnitPrice(salesLastMonth);

  // 14-day trend
  const allSalesMap: Record<string, number> = {};
  for (const s of [...salesLastMonth, ...salesThisMonth]) {
    allSalesMap[s.date] = (allSalesMap[s.date] ?? 0) + s.amount;
  }
  const trendDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (13 - i));
    const dateStr = getDateStr(d);
    return { dateStr, amount: allSalesMap[dateStr] ?? 0, isToday: dateStr === todayStr };
  });
  const maxTrend = Math.max(...trendDays.map((d) => d.amount), 1);

  // Calendar
  const salesByDay: Record<string, number> = {};
  for (const s of salesThisMonth) {
    salesByDay[s.date] = (salesByDay[s.date] ?? 0) + s.amount;
  }
  const maxDayAmount = Math.max(...Object.values(salesByDay), 1);
  const firstDay = new Date(year, month - 1, 1).getDay();
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const calendarCells = [
    ...Array<null>(adjustedFirstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // P/L
  const grossProfit = thisMonthAmount - expensesThisMonth;
  const lastMonthGrossProfit = lastMonthAmount - expensesLastMonth;

  const shortDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
          ダッシュボード
        </h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          {year}年{month}月{today.getDate()}日（{WEEK_LABELS[today.getDay()]}）
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="本日の売上"
          value={fmt(todayAmount)}
          change={changePct(todayAmount, yesterdayAmount)}
          sub="前日比"
        />
        <KpiCard
          label="今週の売上"
          value={fmt(thisWeekAmount)}
          change={changePct(thisWeekAmount, lastWeekAmount)}
          sub="先週比"
        />
        <KpiCard
          label="今月の売上"
          value={fmt(thisMonthAmount)}
          change={changePct(thisMonthAmount, lastMonthAmount)}
          sub="前月比"
        />
        <KpiCard
          label="今月の客単価"
          value={thisMonthUnitPrice > 0 ? fmt(thisMonthUnitPrice) : "-"}
          change={changePct(thisMonthUnitPrice, lastMonthUnitPrice)}
          sub="前月比"
        />
      </div>

      {/* Trend chart + P/L */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 14-day trend */}
        <div className="lg:col-span-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
            直近14日間の売上推移
          </h3>
          <div className="flex items-end gap-1 h-36">
            {trendDays.map((d, i) => {
              const heightPct =
                d.amount > 0 ? Math.max((d.amount / maxTrend) * 100, 3) : 0;
              return (
                <div
                  key={d.dateStr}
                  className="flex-1 flex flex-col items-center group relative"
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-8 hidden group-hover:block z-10 pointer-events-none">
                    <div className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
                      {shortDate(d.dateStr)}: {fmt(d.amount)}
                    </div>
                  </div>
                  <div className="w-full flex items-end h-28">
                    <div
                      className={`w-full rounded-t transition-all ${
                        d.isToday
                          ? "bg-blue-600"
                          : "bg-neutral-200 dark:bg-neutral-700 hover:bg-blue-400 dark:hover:bg-blue-600"
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  {(i === 0 || i === 6 || i === 13 || d.isToday) && (
                    <span className="text-[9px] text-neutral-400 whitespace-nowrap mt-1">
                      {shortDate(d.dateStr)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* P/L Summary */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
            今月の収支
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-neutral-500">売上</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {fmt(thisMonthAmount)}
                </span>
              </div>
              <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full w-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-neutral-500">費用</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {fmt(expensesThisMonth)}
                </span>
              </div>
              <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-400 rounded-full"
                  style={{
                    width: `${
                      thisMonthAmount > 0
                        ? Math.min(
                            (expensesThisMonth / thisMonthAmount) * 100,
                            100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-500">粗利益</span>
                <span
                  className={`text-base font-bold ${
                    grossProfit >= 0
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-red-500"
                  }`}
                >
                  {fmt(grossProfit)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400">利益率</span>
                <span className="text-xs text-neutral-600 dark:text-neutral-400">
                  {thisMonthAmount > 0
                    ? `${((grossProfit / thisMonthAmount) * 100).toFixed(1)}%`
                    : "-"}
                </span>
              </div>
              {lastMonthGrossProfit !== 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-400">前月粗利</span>
                  <span className="text-xs text-neutral-500">
                    {fmt(lastMonthGrossProfit)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar + Recent sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Calendar */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 dark:border-neutral-800">
            <h3 className="font-semibold text-neutral-800 dark:text-neutral-200">
              {year}年{month}月
            </h3>
            <span className="text-xs text-neutral-400">売上カレンダー</span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-7 mb-1">
              {CALENDAR_DAYS.map((d, i) => (
                <div
                  key={d}
                  className={`text-center text-xs font-medium pb-1 ${
                    i === 5
                      ? "text-blue-500"
                      : i === 6
                      ? "text-red-400"
                      : "text-neutral-400"
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
              {calendarCells.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} />;
                const isToday = day === today.getDate();
                const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const amount = salesByDay[dateStr] ?? 0;
                const col = idx % 7;
                const intensity =
                  amount > 0
                    ? Math.min(Math.ceil((amount / maxDayAmount) * 4), 4)
                    : 0;
                const intensityBg = [
                  "",
                  "bg-blue-100 dark:bg-blue-950",
                  "bg-blue-200 dark:bg-blue-900",
                  "bg-blue-300 dark:bg-blue-800",
                  "bg-blue-400 dark:bg-blue-700",
                ][intensity];
                return (
                  <div key={day} className="flex flex-col items-center gap-0.5">
                    <div
                      title={amount > 0 ? fmt(amount) : undefined}
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-sm transition-colors cursor-default
                        ${
                          isToday
                            ? "bg-blue-600 text-white font-bold"
                            : `${intensityBg} ${
                                col === 5 && !isToday
                                  ? "text-blue-500"
                                  : col === 6 && !isToday
                                  ? "text-red-400"
                                  : "text-neutral-800 dark:text-neutral-200"
                              }`
                        }
                      `}
                    >
                      {day}
                    </div>
                    {amount > 0 && !isToday && (
                      <div
                        className={`w-1 h-1 rounded-full ${
                          intensity >= 3
                            ? "bg-blue-500"
                            : "bg-neutral-300 dark:bg-neutral-600"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="mt-3 flex items-center gap-2 justify-end">
              <span className="text-[10px] text-neutral-400">売上:</span>
              {["bg-blue-100 dark:bg-blue-950", "bg-blue-200 dark:bg-blue-900", "bg-blue-300 dark:bg-blue-800", "bg-blue-400 dark:bg-blue-700"].map((cls, i) => (
                <div key={i} className={`w-4 h-4 rounded ${cls}`} />
              ))}
              <span className="text-[10px] text-neutral-400">高</span>
            </div>
          </div>
        </div>

        {/* Recent sales */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 dark:border-neutral-800">
            <h3 className="font-semibold text-neutral-800 dark:text-neutral-200">
              最近の売上
            </h3>
            <Link
              href="/accounting"
              className="text-xs text-blue-500 hover:underline"
            >
              すべて見る
            </Link>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {recentSales.length === 0 ? (
              <p className="text-sm text-neutral-400 p-6 text-center">
                まだデータがありません
              </p>
            ) : (
              recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        {sale.date}
                      </span>
                      {sale.time_slot && (
                        <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded">
                          {sale.time_slot}
                        </span>
                      )}
                      {sale.weather && (
                        <span className="text-sm">
                          {WEATHER_ICON[sale.weather] ?? sale.weather}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {sale.customer_count}名
                    </p>
                  </div>
                  <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {fmt(sale.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
