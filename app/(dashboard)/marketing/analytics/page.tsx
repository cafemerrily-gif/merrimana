import { createClient } from "@/utils/supabase/server";

function getMonthRange(year: number, month: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    start: `${year}-${pad(month)}-01`,
    end: `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`,
    key: `${year}-${pad(month)}`,
    label: `${month}月`,
  };
}

export default async function AnalyticsPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // 直近6ヶ月
  const sixMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(year, month - 1 - (5 - i), 1);
    return getMonthRange(d.getFullYear(), d.getMonth() + 1);
  });
  const oldest = sixMonths[0];

  let dbError = false;
  let monthlyData: {
    label: string;
    sales: number;
    adCost: number;
    roi: number | null;
  }[] = [];
  let channelSummary: { channel: string; cost: number; count: number }[] = [];
  let activeCampaigns: { title: string; start_date: string | null; end_date: string | null }[] = [];
  let totalAdCost = 0;
  let totalSales = 0;

  try {
    const supabase = await createClient();

    const [{ data: salesData }, { data: adsData }, { data: campaignsData }] = await Promise.all([
      supabase
        .from("sales")
        .select("date, amount")
        .gte("date", oldest.start),
      supabase
        .from("ads")
        .select("channel, cost, start_date, status"),
      supabase
        .from("campaigns")
        .select("title, start_date, end_date, status")
        .eq("status", "実施中"),
    ]);

    // 月別売上集計
    const salesByMonth = new Map<string, number>();
    (salesData ?? []).forEach((s) => {
      const key = s.date.slice(0, 7);
      salesByMonth.set(key, (salesByMonth.get(key) ?? 0) + s.amount);
    });

    // 広告費：start_dateの月で集計（start_dateなしは今月扱い）
    const adCostByMonth = new Map<string, number>();
    (adsData ?? []).forEach((a) => {
      const key = a.start_date ? a.start_date.slice(0, 7) : `${year}-${String(month).padStart(2, "0")}`;
      if (sixMonths.some((m) => m.key === key)) {
        adCostByMonth.set(key, (adCostByMonth.get(key) ?? 0) + a.cost);
      }
    });

    monthlyData = sixMonths.map((m) => {
      const sales = salesByMonth.get(m.key) ?? 0;
      const adCost = adCostByMonth.get(m.key) ?? 0;
      const roi = adCost > 0 ? Math.round(((sales - adCost) / adCost) * 100) : null;
      return { label: m.label, sales, adCost, roi };
    });

    // チャネル別集計（全期間）
    const channelMap = new Map<string, { cost: number; count: number }>();
    (adsData ?? []).forEach((a) => {
      const prev = channelMap.get(a.channel) ?? { cost: 0, count: 0 };
      channelMap.set(a.channel, { cost: prev.cost + a.cost, count: prev.count + 1 });
    });
    channelSummary = Array.from(channelMap.entries())
      .map(([channel, v]) => ({ channel, ...v }))
      .sort((a, b) => b.cost - a.cost);

    totalAdCost = (adsData ?? []).reduce((s, a) => s + a.cost, 0);
    totalSales = Array.from(salesByMonth.values()).reduce((s, v) => s + v, 0);
    activeCampaigns = campaignsData ?? [];
  } catch {
    dbError = true;
  }

  const overallRoi = totalAdCost > 0
    ? Math.round(((totalSales - totalAdCost) / totalAdCost) * 100)
    : null;

  const maxBar = Math.max(...monthlyData.map((d) => Math.max(d.sales, d.adCost)), 1);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">PR効果分析</h1>
        <p className="text-sm text-neutral-500 mt-0.5">広報・マーケティングユニット</p>
      </div>

      {dbError ? (
        <div className="py-16 text-center text-sm text-neutral-400 rounded-xl border border-neutral-200 dark:border-neutral-800">
          データを取得できませんでした。Supabaseの接続設定を確認してください。
        </div>
      ) : (
        <>
          {/* KPI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "直近6ヶ月 累計売上", value: `¥${totalSales.toLocaleString()}` },
              { label: "直近6ヶ月 広告費", value: `¥${totalAdCost.toLocaleString()}` },
              {
                label: "広告ROI",
                value: overallRoi !== null ? `${overallRoi > 0 ? "+" : ""}${overallRoi}%` : "—",
                highlight: overallRoi !== null ? (overallRoi >= 0 ? "blue" : "red") : null,
              },
              { label: "実施中キャンペーン", value: `${activeCampaigns.length}件` },
            ].map(({ label, value, highlight }) => (
              <div
                key={label}
                className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4"
              >
                <p className="text-xs text-neutral-400 mb-1">{label}</p>
                <p
                  className={`text-xl font-bold tabular-nums ${
                    highlight === "blue"
                      ? "text-blue-600 dark:text-blue-400"
                      : highlight === "red"
                      ? "text-red-500"
                      : "text-neutral-900 dark:text-neutral-100"
                  }`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* 月別 売上 vs 広告費 グラフ */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
            <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
              月別 売上 vs 広告費（直近6ヶ月）
            </h2>
            {monthlyData.every((d) => d.sales === 0 && d.adCost === 0) ? (
              <p className="text-sm text-neutral-400 text-center py-8">
                売上・広告データを登録するとグラフが表示されます。
              </p>
            ) : (
              <>
                <div className="flex items-end gap-4 h-40">
                  {monthlyData.map(({ label, sales, adCost, roi }) => (
                    <div key={label} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end justify-center gap-0.5" style={{ height: "100px" }}>
                        <div
                          className="flex-1 rounded-t bg-blue-500 dark:bg-blue-600 transition-all"
                          style={{ height: `${Math.max((sales / maxBar) * 100, sales > 0 ? 2 : 0)}%` }}
                          title={`売上 ¥${sales.toLocaleString()}`}
                        />
                        <div
                          className="flex-1 rounded-t bg-orange-400 dark:bg-orange-500 transition-all"
                          style={{ height: `${Math.max((adCost / maxBar) * 100, adCost > 0 ? 2 : 0)}%` }}
                          title={`広告費 ¥${adCost.toLocaleString()}`}
                        />
                      </div>
                      <span className="text-xs text-neutral-400">{label}</span>
                      {roi !== null && (
                        <span className={`text-xs font-medium ${roi >= 0 ? "text-blue-500" : "text-red-400"}`}>
                          {roi >= 0 ? "+" : ""}{roi}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-2.5 rounded bg-blue-500 inline-block" />売上
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-2.5 rounded bg-orange-400 inline-block" />広告費
                  </span>
                  <span className="text-neutral-300 dark:text-neutral-600">※ ROIは（売上-広告費）÷広告費×100</span>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* チャネル別広告費 */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
              <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
                チャネル別広告費（累計）
              </h2>
              {channelSummary.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-6">広告を登録するとここに表示されます。</p>
              ) : (
                <div className="space-y-3">
                  {channelSummary.map(({ channel, cost, count }) => {
                    const pct = totalAdCost > 0 ? (cost / totalAdCost) * 100 : 0;
                    return (
                      <div key={channel}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-neutral-700 dark:text-neutral-300">
                            {channel}
                            <span className="text-xs text-neutral-400 ml-1.5">{count}件</span>
                          </span>
                          <span className="text-neutral-500 tabular-nums text-xs">
                            ¥{cost.toLocaleString()} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 実施中キャンペーン */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
              <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
                実施中キャンペーン
              </h2>
              {activeCampaigns.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-6">
                  実施中のキャンペーンはありません。
                </p>
              ) : (
                <div className="space-y-2">
                  {activeCampaigns.map((c) => (
                    <div
                      key={c.title}
                      className="flex items-start justify-between gap-2 py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                    >
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">
                        {c.title}
                      </p>
                      {(c.start_date || c.end_date) && (
                        <p className="text-xs text-neutral-400 shrink-0">
                          {c.start_date ?? "—"} 〜 {c.end_date ?? "—"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-neutral-400">
            ※ 売上データは「売上管理」、広告費データは「広告管理」の登録内容から集計されます。
          </p>
        </>
      )}
    </div>
  );
}
