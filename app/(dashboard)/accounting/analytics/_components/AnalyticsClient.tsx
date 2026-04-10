"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { WEATHER_OPTIONS, WEATHER_ICON } from "@/types/accounting";
import type { SaleForAnalytics, ProductCategory } from "../page";
import { cn } from "@/utils/cn";

// ----------------------------------------------------------------
// Mini chart helpers
// ----------------------------------------------------------------

function BarChart({
  data,
  labelKey,
  valueKey,
  color = "bg-blue-500 dark:bg-blue-600",
  formatValue,
  height = 120,
  showValue = true,
}: {
  data: Record<string, unknown>[];
  labelKey: string;
  valueKey: string;
  color?: string;
  formatValue?: (v: number) => string;
  height?: number;
  showValue?: boolean;
}) {
  const max = Math.max(...data.map((d) => d[valueKey] as number), 1);
  const fmt = formatValue ?? ((v: number) => v > 0 ? `¥${Math.round(v / 1000)}k` : "");
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => {
        const val = d[valueKey] as number;
        const pct = (val / max) * 100;
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0 h-full justify-end">
            {showValue && val > 0 && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums truncate" style={{ fontSize: 10 }}>
                {fmt(val)}
              </span>
            )}
            <div className="w-full flex items-end" style={{ height: height - 20 }}>
              <div
                className={cn("w-full rounded-t transition-all", color)}
                style={{ height: `${Math.max(pct, val > 0 ? 3 : 0)}%` }}
                title={`${d[labelKey]}: ${fmt(val)}`}
              />
            </div>
            <span className="text-neutral-400 truncate w-full text-center" style={{ fontSize: 10 }}>
              {String(d[labelKey])}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HBar({
  name,
  value,
  max,
  total,
  color = "bg-blue-500 dark:bg-blue-600",
  badge,
}: {
  name: string;
  value: number;
  max: number;
  total: number;
  color?: string;
  badge?: React.ReactNode;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const share = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-neutral-700 dark:text-neutral-300 truncate w-28 shrink-0">
        {badge}{name}
      </span>
      <div className="flex-1 h-4 bg-neutral-100 dark:bg-neutral-800 rounded overflow-hidden">
        <div className={cn("h-full rounded transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-neutral-500 w-16 text-right shrink-0">
        ¥{value.toLocaleString()}
      </span>
      <span className="text-xs tabular-nums text-neutral-400 w-10 text-right shrink-0">
        {share}%
      </span>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  empty,
  emptyMsg = "データがありません",
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  empty?: boolean;
  emptyMsg?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5", className)}>
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{title}</h2>
        {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
      </div>
      {empty ? (
        <div className="py-8 text-center text-xs text-neutral-400">{emptyMsg}</div>
      ) : (
        children
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// Main component
// ----------------------------------------------------------------

const CATEGORY_COLORS = [
  "bg-blue-500", "bg-teal-500", "bg-violet-500", "bg-orange-400",
  "bg-pink-500", "bg-green-500", "bg-yellow-500", "bg-red-400",
];

const DOW_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default function AnalyticsClient({
  sales,
  productCategories,
  currentMonth,
  availableMonths,
  dbError,
}: {
  sales: SaleForAnalytics[];
  productCategories: ProductCategory[];
  currentMonth: string;
  availableMonths: string[];
  dbError: boolean;
}) {
  const router = useRouter();

  const catMap = useMemo(() => {
    const m: Record<string, string> = {};
    productCategories.forEach((p) => { m[p.id] = p.category_name; });
    return m;
  }, [productCategories]);

  // 1. 時間帯別売上
  const hourlyData = useMemo(() => {
    const map: Record<string, { amount: number; count: number; customers: number }> = {};
    sales.forEach((s) => {
      const key = s.time_slot ?? "__none__";
      if (!map[key]) map[key] = { amount: 0, count: 0, customers: 0 };
      map[key].amount += s.amount;
      map[key].count += 1;
      map[key].customers += s.customer_count;
    });
    const entries = Object.entries(map)
      .filter(([k]) => k !== "__none__")
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([slot, d]) => ({ slot, ...d, avg: d.count > 0 ? Math.round(d.amount / d.count) : 0 }));
    return entries;
  }, [sales]);

  const hasTimeSlot = hourlyData.length > 0;

  // 2. 曜日別売上
  const dowData = useMemo(() => {
    const map: Record<number, { amount: number; count: number }> = {};
    sales.forEach((s) => {
      const dow = new Date(s.date + "T00:00:00").getDay();
      if (!map[dow]) map[dow] = { amount: 0, count: 0 };
      map[dow].amount += s.amount;
      map[dow].count += 1;
    });
    return [1, 2, 3, 4, 5, 6, 0].map((dow) => ({
      dow,
      label: DOW_LABELS[dow],
      amount: map[dow]?.amount ?? 0,
      count: map[dow]?.count ?? 0,
      avg: map[dow]?.count ? Math.round(map[dow].amount / map[dow].count) : 0,
    }));
  }, [sales]);

  // 3. 天気別売上
  const weatherData = useMemo(() => {
    const map: Record<string, { amount: number; count: number; customers: number }> = {};
    sales.forEach((s) => {
      if (!s.weather) return;
      if (!map[s.weather]) map[s.weather] = { amount: 0, count: 0, customers: 0 };
      map[s.weather].amount += s.amount;
      map[s.weather].count += 1;
      map[s.weather].customers += s.customer_count;
    });
    return WEATHER_OPTIONS.filter((w) => map[w]).map((w) => ({
      weather: w,
      icon: WEATHER_ICON[w],
      amount: map[w].amount,
      count: map[w].count,
      avg: Math.round(map[w].amount / map[w].count),
      avgCustomers: map[w].count > 0 ? Math.round(map[w].customers / map[w].count) : 0,
    }));
  }, [sales]);

  // 4. 商品別売上
  const productData = useMemo(() => {
    const map: Record<string, { name: string; category: string; quantity: number; amount: number }> = {};
    sales.forEach((s) => {
      s.sale_items.forEach((item) => {
        if (!map[item.product_id]) {
          map[item.product_id] = {
            name: item.product_name,
            category: catMap[item.product_id] ?? "未設定",
            quantity: 0,
            amount: 0,
          };
        }
        map[item.product_id].quantity += item.quantity;
        map[item.product_id].amount += item.subtotal;
      });
    });
    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [sales, catMap]);

  // 5. カテゴリ別売上
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    productData.forEach((p) => {
      map[p.category] = (map[p.category] ?? 0) + p.amount;
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([name, amount]) => ({ name, amount }));
  }, [productData]);

  // 6. ABC分析
  const abcData = useMemo(() => {
    const total = productData.reduce((s, p) => s + p.amount, 0);
    if (total === 0) return [];
    let cum = 0;
    return productData.map((p) => {
      cum += p.amount;
      const cumPct = (cum / total) * 100;
      const rank: "A" | "B" | "C" = cumPct <= 70 ? "A" : cumPct <= 90 ? "B" : "C";
      return { ...p, pct: (p.amount / total) * 100, cumPct, rank };
    });
  }, [productData]);

  // 7. 客単価・来客数（日別）
  const dailyCustomerData = useMemo(() => {
    const map: Record<string, { amount: number; customers: number; count: number }> = {};
    sales.forEach((s) => {
      if (!map[s.date]) map[s.date] = { amount: 0, customers: 0, count: 0 };
      map[s.date].amount += s.amount;
      map[s.date].customers += s.customer_count;
      map[s.date].count += 1;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date,
        label: String(parseInt(date.split("-")[2])),
        amount: d.amount,
        customers: d.customers,
        unitPrice: d.customers > 0 ? Math.round(d.amount / d.customers) : 0,
      }));
  }, [sales]);

  const totalAmount = sales.reduce((s, r) => s + r.amount, 0);
  const totalCustomers = sales.reduce((s, r) => s + r.customer_count, 0);
  const productMax = productData[0]?.amount ?? 1;
  const categoryMax = categoryData[0]?.amount ?? 1;
  const [labelYear, labelMonth] = currentMonth.split("-");

  const abcColors: Record<string, string> = {
    A: "bg-blue-500 dark:bg-blue-600",
    B: "bg-yellow-400 dark:bg-yellow-500",
    C: "bg-neutral-300 dark:bg-neutral-600",
  };

  if (dbError) {
    return (
      <div className="py-16 text-center text-sm text-neutral-400 rounded-xl border border-neutral-200 dark:border-neutral-800 max-w-4xl">
        データを取得できませんでした。
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">アナリティクス</h1>
          <p className="text-sm text-neutral-500 mt-0.5">会計・経営戦略ユニット</p>
        </div>
        <select
          value={currentMonth}
          onChange={(e) => router.push(`/accounting/analytics?month=${e.target.value}`)}
          className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          {availableMonths.map((m) => {
            const [y, mo] = m.split("-");
            return (
              <option key={m} value={m}>{y}年{parseInt(mo)}月</option>
            );
          })}
        </select>
      </div>

      {/* サマリーバー */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "売上合計", value: `¥${totalAmount.toLocaleString()}` },
          { label: "来客数", value: `${totalCustomers}名` },
          { label: "客単価", value: totalCustomers > 0 ? `¥${Math.round(totalAmount / totalCustomers).toLocaleString()}` : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 text-center">
            <p className="text-xs text-neutral-400 mb-1">{labelYear}年{parseInt(labelMonth)}月 {label}</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
          </div>
        ))}
      </div>

      {sales.length === 0 ? (
        <div className="py-20 text-center text-sm text-neutral-400 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700">
          {labelYear}年{parseInt(labelMonth)}月の売上データがありません。
        </div>
      ) : (
        <>
          {/* 時間帯別売上 */}
          <ChartCard
            title="時間帯別売上"
            subtitle="営業時間内の1時間ごとの売上合計"
            empty={!hasTimeSlot}
            emptyMsg="時間帯データがありません。売上入力時に時間帯を設定してください。"
          >
            <BarChart
              data={hourlyData as unknown as Record<string, unknown>[]}
              labelKey="slot"
              valueKey="amount"
              height={140}
              formatValue={(v) => v > 0 ? `¥${Math.round(v / 1000)}k` : ""}
            />
            <div className="mt-3 grid grid-cols-3 gap-2">
              {hourlyData.slice(0, 3).map((d) => (
                <div key={d.slot} className="rounded-lg bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-center">
                  <p className="text-xs text-neutral-400">{d.slot} 帯</p>
                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">¥{d.amount.toLocaleString()}</p>
                  <p className="text-xs text-neutral-400">{d.count}件 / 平均¥{d.avg.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* 曜日別 + 天気別 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="曜日別平均売上" subtitle="日ごとの平均売上金額">
              <BarChart
                data={dowData as unknown as Record<string, unknown>[]}
                labelKey="label"
                valueKey="avg"
                color="bg-teal-500 dark:bg-teal-600"
                height={130}
                formatValue={(v) => v > 0 ? `¥${Math.round(v / 1000)}k` : ""}
              />
              <div className="mt-2 flex gap-1 flex-wrap">
                {dowData.filter(d => d.count > 0).map(d => (
                  <span key={d.dow} className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded-full">
                    {d.label}: {d.count}日
                  </span>
                ))}
              </div>
            </ChartCard>

            <ChartCard
              title="天気別売上比較"
              subtitle="天気ごとの平均売上・来客数"
              empty={weatherData.length === 0}
              emptyMsg="天気データがありません。売上入力時に天気を選択してください。"
            >
              <div className="space-y-3">
                {weatherData.map((w) => {
                  const wMax = Math.max(...weatherData.map((x) => x.avg), 1);
                  const pct = (w.avg / wMax) * 100;
                  return (
                    <div key={w.weather}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{w.icon} {w.weather}</span>
                        <span className="text-xs text-neutral-500 tabular-nums">
                          平均¥{w.avg.toLocaleString()} / {w.count}日
                        </span>
                      </div>
                      <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded overflow-hidden">
                        <div
                          className="h-full bg-blue-400 dark:bg-blue-600 rounded transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </ChartCard>
          </div>

          {/* 商品別 + カテゴリ別 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard
              title="商品別売上 TOP10"
              subtitle="売上金額順"
              empty={productData.length === 0}
              emptyMsg="商品明細データがありません。"
            >
              <div className="space-y-2">
                {productData.slice(0, 10).map((p, i) => (
                  <HBar
                    key={p.name}
                    name={p.name}
                    value={p.amount}
                    max={productMax}
                    total={totalAmount}
                    color={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                    badge={<span className="text-neutral-300 dark:text-neutral-600 mr-1">{i + 1}.</span>}
                  />
                ))}
              </div>
            </ChartCard>

            <ChartCard
              title="カテゴリ別売上"
              subtitle="商品カテゴリごとの売上構成"
              empty={categoryData.length === 0}
              emptyMsg="カテゴリデータがありません。"
            >
              <div className="space-y-2 mb-4">
                {categoryData.map((c, i) => (
                  <HBar
                    key={c.name}
                    name={c.name}
                    value={c.amount}
                    max={categoryMax}
                    total={totalAmount}
                    color={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                  />
                ))}
              </div>
              {/* 積み上げバー */}
              {categoryData.length > 0 && (
                <div className="mt-3">
                  <div className="flex h-4 rounded overflow-hidden">
                    {categoryData.map((c, i) => (
                      <div
                        key={c.name}
                        className={cn("h-full", CATEGORY_COLORS[i % CATEGORY_COLORS.length])}
                        style={{ width: `${totalAmount > 0 ? (c.amount / totalAmount) * 100 : 0}%` }}
                        title={`${c.name}: ¥${c.amount.toLocaleString()}`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-3 flex-wrap mt-2">
                    {categoryData.map((c, i) => (
                      <span key={c.name} className="flex items-center gap-1 text-xs text-neutral-500">
                        <span className={cn("w-2 h-2 rounded-full inline-block", CATEGORY_COLORS[i % CATEGORY_COLORS.length])} />
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </ChartCard>
          </div>

          {/* ABC分析 */}
          <ChartCard
            title="ABC分析"
            subtitle="売上貢献度による商品ランク分け　A: 上位70%  B: 70〜90%  C: 90〜100%"
            empty={abcData.length === 0}
            emptyMsg="商品明細データがありません。"
          >
            <div className="space-y-1.5">
              {abcData.map((p, i) => (
                <div key={p.name} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-6 h-5 rounded text-xs font-bold flex items-center justify-center text-white shrink-0",
                      abcColors[p.rank]
                    )}
                  >
                    {p.rank}
                  </span>
                  <span className="text-xs text-neutral-700 dark:text-neutral-300 truncate w-28 shrink-0">
                    {p.name}
                  </span>
                  <div className="flex-1 h-4 bg-neutral-100 dark:bg-neutral-800 rounded overflow-hidden">
                    <div
                      className={cn("h-full rounded", abcColors[p.rank])}
                      style={{ width: `${p.pct}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-neutral-500 w-16 text-right shrink-0">
                    ¥{p.amount.toLocaleString()}
                  </span>
                  <span className="text-xs tabular-nums text-neutral-400 w-14 text-right shrink-0">
                    累計{p.cumPct.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-4">
              {(["A", "B", "C"] as const).map((rank) => {
                const items = abcData.filter((p) => p.rank === rank);
                const rankTotal = items.reduce((s, p) => s + p.amount, 0);
                return (
                  <div key={rank} className="flex-1 rounded-lg bg-neutral-50 dark:bg-neutral-800 p-3 text-center">
                    <span className={cn("inline-block w-6 h-5 rounded text-xs font-bold text-white mb-1", abcColors[rank])}>
                      {rank}
                    </span>
                    <p className="text-xs text-neutral-500">{items.length}品目</p>
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">¥{rankTotal.toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
          </ChartCard>

          {/* 日別客単価 */}
          <ChartCard
            title="日別客単価推移"
            subtitle="1日あたりの客単価（来客数がある日のみ）"
            empty={dailyCustomerData.filter((d) => d.unitPrice > 0).length === 0}
            emptyMsg="来客数データがありません。売上入力時に来客数を入力してください。"
          >
            <BarChart
              data={dailyCustomerData.filter((d) => d.unitPrice > 0) as unknown as Record<string, unknown>[]}
              labelKey="label"
              valueKey="unitPrice"
              color="bg-violet-500 dark:bg-violet-600"
              height={130}
              formatValue={(v) => `¥${v.toLocaleString()}`}
            />
          </ChartCard>

          {/* 日別売上 vs 来客数 */}
          <ChartCard
            title="日別売上 vs 来客数"
            subtitle="各日の売上と来客数の相関"
            empty={dailyCustomerData.length === 0}
          >
            <div className="space-y-1.5">
              {dailyCustomerData.map((d) => {
                const dayMax = Math.max(...dailyCustomerData.map((x) => x.amount), 1);
                const custMax = Math.max(...dailyCustomerData.map((x) => x.customers), 1);
                return (
                  <div key={d.date} className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400 tabular-nums w-12 shrink-0">{d.date.slice(5)}</span>
                    <div className="flex-1 flex gap-1">
                      <div className="flex-1 h-3 bg-neutral-100 dark:bg-neutral-800 rounded overflow-hidden">
                        <div
                          className="h-full bg-blue-400 dark:bg-blue-600 rounded"
                          style={{ width: `${(d.amount / dayMax) * 100}%` }}
                          title={`売上: ¥${d.amount.toLocaleString()}`}
                        />
                      </div>
                      <div className="flex-1 h-3 bg-neutral-100 dark:bg-neutral-800 rounded overflow-hidden">
                        <div
                          className="h-full bg-teal-400 dark:bg-teal-600 rounded"
                          style={{ width: `${(d.customers / custMax) * 100}%` }}
                          title={`来客数: ${d.customers}名`}
                        />
                      </div>
                    </div>
                    <span className="text-xs tabular-nums text-neutral-500 w-20 text-right shrink-0">
                      ¥{d.amount.toLocaleString()}
                    </span>
                    <span className="text-xs tabular-nums text-neutral-400 w-10 text-right shrink-0">
                      {d.customers}名
                    </span>
                  </div>
                );
              })}
              <div className="flex items-center gap-4 mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <span className="flex items-center gap-1 text-xs text-neutral-400">
                  <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />売上
                </span>
                <span className="flex items-center gap-1 text-xs text-neutral-400">
                  <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />来客数
                </span>
              </div>
            </div>
          </ChartCard>
        </>
      )}
    </div>
  );
}
