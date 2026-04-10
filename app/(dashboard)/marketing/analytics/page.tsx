import { createClient } from "@/utils/supabase/server";
import { cn } from "@/utils/cn";

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function getMonthRange(year: number, month: number) {
  return {
    start: `${year}-${pad(month)}-01`,
    end: `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`,
    key: `${year}-${pad(month)}`,
    label: `${month}月`,
  };
}
function diffDays(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1;
}

// ─── 型 ───────────────────────────────────────────────────────────
type SaleRow = { date: string; amount: number; customer_count: number };
type PrRow = {
  id: string; title: string; channel: string; status: string;
  scheduled_at: string | null; campaign_id: string | null;
  campaign: { id: string; title: string; start_date: string | null; end_date: string | null } | null;
};
type CampaignRow = {
  id: string; title: string; status: string;
  start_date: string | null; end_date: string | null; tags: string[];
};
type ProductRow = { id: string; name: string; sale_start: string | null; sale_end: string | null; status: string };

// ─── サブコンポーネント ───────────────────────────────────────────
function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      <p className="text-xs text-neutral-400 mb-1">{label}</p>
      <p className="text-xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">{value}</p>
      {sub && <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">{children}</h2>
  );
}

export default async function AnalyticsPage() {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // 直近6ヶ月
  const sixMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(year, month - 1 - (5 - i), 1);
    return getMonthRange(d.getFullYear(), d.getMonth() + 1);
  });

  // キャンペーン効果分析用に最大12ヶ月前まで売上を取得
  const twelveMonthsAgo = new Date(year, month - 13, 1).toISOString().slice(0, 10);

  let dbError = false;
  let salesData: SaleRow[] = [];
  let prData: PrRow[] = [];
  let campaigns: CampaignRow[] = [];
  let productsWithPeriod: ProductRow[] = [];

  try {
    const supabase = await createClient();
    const [salesRes, prRes, campRes, prodRes] = await Promise.all([
      supabase.from("sales").select("date, amount, customer_count").gte("date", twelveMonthsAgo),
      supabase.from("pr_activities").select(
        "id, title, channel, status, scheduled_at, campaign_id, campaign:campaigns(id, title, start_date, end_date)"
      ),
      supabase.from("campaigns").select("id, title, status, start_date, end_date, tags").order("start_date", { ascending: false }),
      supabase.from("products").select("id, name, sale_start, sale_end, status").or("sale_start.not.is.null,sale_end.not.is.null"),
    ]);
    salesData = (salesRes.data ?? []) as SaleRow[];
    prData = (prRes.data ?? []) as unknown as PrRow[];
    campaigns = (campRes.data ?? []) as CampaignRow[];
    productsWithPeriod = ((prodRes.data ?? []) as ProductRow[]).filter((p) => p.sale_start || p.sale_end);
  } catch {
    dbError = true;
  }

  if (dbError) {
    return (
      <div className="py-16 text-center text-sm text-neutral-400 rounded-xl border border-neutral-200 dark:border-neutral-800 max-w-4xl">
        データを取得できませんでした。Supabaseの接続設定を確認してください。
      </div>
    );
  }

  // ── 月別集計 ──
  const salesByMonth = new Map<string, { customers: number; amount: number }>();
  salesData.forEach((s) => {
    const key = s.date.slice(0, 7);
    const p = salesByMonth.get(key) ?? { customers: 0, amount: 0 };
    salesByMonth.set(key, { customers: p.customers + (s.customer_count ?? 0), amount: p.amount + s.amount });
  });
  const prByMonth = new Map<string, number>();
  prData.forEach((p) => {
    if (p.scheduled_at) {
      const key = p.scheduled_at.slice(0, 7);
      prByMonth.set(key, (prByMonth.get(key) ?? 0) + 1);
    }
  });
  const monthlyStats = sixMonths.map((m) => ({
    label: m.label, key: m.key,
    customers: salesByMonth.get(m.key)?.customers ?? 0,
    amount: salesByMonth.get(m.key)?.amount ?? 0,
    prCount: prByMonth.get(m.key) ?? 0,
  }));

  // ── KPI ──
  const totalCustomers = monthlyStats.reduce((s, m) => s + m.customers, 0);
  const totalPr = prData.length;
  const completedPr = prData.filter((p) => p.status === "完了").length;
  const activeCampaignCount = campaigns.filter((c) => c.status === "実施中").length;

  // ── チャネル別集計 ──
  type ChannelStat = {
    count: number; completed: number;
    activities: { title: string; scheduled_at: string | null; status: string; campaignTitle: string | null }[];
  };
  const channelMap = new Map<string, ChannelStat>();
  prData.forEach((p) => {
    const prev = channelMap.get(p.channel) ?? { count: 0, completed: 0, activities: [] };
    channelMap.set(p.channel, {
      count: prev.count + 1,
      completed: prev.completed + (p.status === "完了" ? 1 : 0),
      activities: [
        ...prev.activities,
        { title: p.title, scheduled_at: p.scheduled_at, status: p.status, campaignTitle: p.campaign?.title ?? null },
      ],
    });
  });
  const channelStats = Array.from(channelMap.entries())
    .map(([channel, stat]) => ({ channel, ...stat }))
    .sort((a, b) => b.count - a.count);
  const maxChannelCount = Math.max(...channelStats.map((c) => c.count), 1);

  // ── キャンペーン効果分析 ──
  type CampaignEffect = {
    id: string; title: string; start_date: string; end_date: string; status: string;
    prCount: number; prChannels: string[];
    duringCustomers: number; duringDays: number; avgDuring: number;
    beforeCustomers: number; beforeDays: number; avgBefore: number;
    changePercent: number | null;
  };
  const campaignEffects: CampaignEffect[] = [];
  for (const c of campaigns) {
    if (!c.start_date || !c.end_date) continue;
    const campaignPr = prData.filter((p) => p.campaign_id === c.id);
    const prChannels = Array.from(new Set(campaignPr.map((p) => p.channel)));

    const start = c.start_date;
    const end = c.end_date <= todayStr ? c.end_date : todayStr;

    let duringCustomers = 0;
    salesData.forEach((s) => { if (s.date >= start && s.date <= end) duringCustomers += s.customer_count ?? 0; });
    const duringDays = Math.max(diffDays(start, end), 1);
    const avgDuring = duringCustomers / duringDays;

    // キャンペーン開始30日前
    const before30 = new Date(c.start_date);
    before30.setDate(before30.getDate() - 30);
    const before30Str = before30.toISOString().slice(0, 10);
    let beforeCustomers = 0;
    let beforeDataDays = 0;
    salesData.forEach((s) => {
      if (s.date >= before30Str && s.date < c.start_date!) {
        beforeCustomers += s.customer_count ?? 0;
        beforeDataDays++;
      }
    });
    const beforeDays = 30;
    const avgBefore = beforeCustomers > 0 ? beforeCustomers / beforeDays : 0;
    const changePercent = avgBefore > 0 ? Math.round(((avgDuring - avgBefore) / avgBefore) * 100) : null;

    campaignEffects.push({
      id: c.id, title: c.title, start_date: c.start_date, end_date: c.end_date, status: c.status,
      prCount: campaignPr.length, prChannels,
      duringCustomers, duringDays, avgDuring: Math.round(avgDuring * 10) / 10,
      beforeCustomers, beforeDays, avgBefore: Math.round(avgBefore * 10) / 10,
      changePercent,
    });
  }

  // ── 商品販売期間 × 来客数 ──
  type ProductSaleStat = {
    name: string; sale_start: string | null; sale_end: string | null;
    customers: number; amount: number; salesDays: number; status: string;
  };
  const productSaleStats: ProductSaleStat[] = productsWithPeriod.map((p) => {
    const start = p.sale_start ?? null;
    const end = p.sale_end ?? null;
    let customers = 0, amount = 0, salesDays = 0;
    salesData.forEach((s) => {
      const inRange = (!start || s.date >= start) && (!end || s.date <= end);
      if (inRange) { customers += s.customer_count ?? 0; amount += s.amount; salesDays++; }
    });
    return { name: p.name, sale_start: start, sale_end: end, customers, amount, salesDays, status: p.status };
  }).sort((a, b) => b.customers - a.customers);

  const maxBar = Math.max(...monthlyStats.map((m) => m.customers), 1);

  const statusColors: Record<string, string> = {
    予定: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    完了: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    見送り: "bg-neutral-100 dark:bg-neutral-800 text-neutral-500",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">PR効果分析</h1>
        <p className="text-sm text-neutral-500 mt-0.5">広報・マーケティングユニット</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="直近6ヶ月 累計来客" value={`${totalCustomers.toLocaleString()}人`} />
        <KpiCard label="PR活動 合計" value={`${totalPr}件`} sub={`完了 ${completedPr}件`} />
        <KpiCard
          label="完了率"
          value={totalPr > 0 ? `${Math.round((completedPr / totalPr) * 100)}%` : "—"}
        />
        <KpiCard label="実施中キャンペーン" value={`${activeCampaignCount}件`} />
      </div>

      {/* 月別来客数グラフ */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
        <SectionTitle>月別来客数（直近6ヶ月）</SectionTitle>
        {monthlyStats.every((m) => m.customers === 0) ? (
          <p className="text-sm text-neutral-400 text-center py-8">
            売上管理で来客数を入力するとグラフが表示されます。
          </p>
        ) : (
          <>
            <div className="flex items-end gap-3 h-36">
              {monthlyStats.map(({ label, customers, prCount }) => (
                <div key={label} className="flex-1 flex flex-col items-center gap-1">
                  {prCount > 0 && (
                    <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">
                      PR {prCount}
                    </span>
                  )}
                  <div
                    className="w-full rounded-t bg-blue-500 dark:bg-blue-600 transition-all min-h-[2px]"
                    style={{ height: `${Math.max((customers / maxBar) * 112, customers > 0 ? 4 : 0)}px` }}
                    title={`${label}: ${customers}人`}
                  />
                  <span className="text-xs text-neutral-400">{label}</span>
                  <span className="text-xs tabular-nums text-neutral-500">{customers > 0 ? customers : "—"}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-neutral-400 mt-2">
              ※ PR N = その月に実施予定のPR活動数
            </p>
          </>
        )}
      </div>

      {/* キャンペーン効果分析 */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
        <SectionTitle>キャンペーン効果分析</SectionTitle>
        {campaignEffects.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-6">
            開始日・終了日が設定されたキャンペーンがあると、来客数の変化を分析できます。
          </p>
        ) : (
          <div className="space-y-4">
            {campaignEffects.map((ce) => (
              <div
                key={ce.id}
                className="rounded-lg border border-neutral-100 dark:border-neutral-800 p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{ce.title}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {ce.start_date} 〜 {ce.end_date}（{ce.duringDays}日間）
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      ce.status === "実施中" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : ce.status === "終了" ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                        : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                    )}>
                      {ce.status}
                    </span>
                    {ce.changePercent !== null && (
                      <span className={cn(
                        "text-sm font-bold tabular-nums",
                        ce.changePercent > 0 ? "text-blue-600 dark:text-blue-400"
                          : ce.changePercent < 0 ? "text-red-500" : "text-neutral-500"
                      )}>
                        {ce.changePercent > 0 ? "+" : ""}{ce.changePercent}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center">
                    <p className="text-xs text-neutral-400">期間前 日均来客</p>
                    <p className="text-base font-bold tabular-nums text-neutral-700 dark:text-neutral-300">
                      {ce.avgBefore > 0 ? `${ce.avgBefore}人` : "データなし"}
                    </p>
                    <p className="text-xs text-neutral-400">（30日前比）</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-neutral-400">期間中 日均来客</p>
                    <p className="text-base font-bold tabular-nums text-blue-600 dark:text-blue-400">
                      {ce.duringCustomers > 0 ? `${ce.avgDuring}人` : "データなし"}
                    </p>
                    <p className="text-xs text-neutral-400">（累計 {ce.duringCustomers}人）</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-neutral-400">PR活動数</p>
                    <p className="text-base font-bold tabular-nums text-neutral-700 dark:text-neutral-300">
                      {ce.prCount}件
                    </p>
                    {ce.prChannels.length > 0 && (
                      <p className="text-xs text-neutral-400 truncate">{ce.prChannels.join("・")}</p>
                    )}
                  </div>
                </div>

                {ce.changePercent === null && (
                  <p className="text-xs text-neutral-400 italic">
                    ※ 売上データが不足しているため変化率を計算できません。
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* チャネル別PR活動内訳 */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
        <SectionTitle>チャネル別PR活動内訳</SectionTitle>
        {channelStats.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-6">PR活動を登録するとここに表示されます。</p>
        ) : (
          <div className="space-y-5">
            {channelStats.map(({ channel, count, completed, activities }) => {
              const completionRate = count > 0 ? Math.round((completed / count) * 100) : 0;
              const barPct = (count / maxChannelCount) * 100;
              return (
                <div key={channel}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{channel}</span>
                    <span className="text-xs text-neutral-500 tabular-nums">
                      {count}件・完了率 {completionRate}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mb-2">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${barPct}%` }} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {activities
                      .slice()
                      .sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""))
                      .map((a, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg px-2.5 py-1.5"
                        >
                          <span className={cn("shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium", statusColors[a.status] ?? "bg-neutral-100 text-neutral-500")}>
                            {a.status}
                          </span>
                          <span className="truncate flex-1">{a.title}</span>
                          {a.campaignTitle && (
                            <span className="shrink-0 text-blue-400 text-[10px]">#{a.campaignTitle}</span>
                          )}
                          {a.scheduled_at && (
                            <span className="shrink-0 text-neutral-400">{a.scheduled_at.slice(5)}</span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 商品販売期間 × 来客数 */}
      {productSaleStats.length > 0 && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <SectionTitle>商品販売期間 × 来客数</SectionTitle>
          <p className="text-xs text-neutral-400 mb-4">
            販売期間が設定された商品の期間中、店舗の来客数・売上合計を表示します。
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <th className="text-left text-xs text-neutral-400 font-medium pb-2">商品名</th>
                  <th className="text-left text-xs text-neutral-400 font-medium pb-2">販売期間</th>
                  <th className="text-right text-xs text-neutral-400 font-medium pb-2">期間中 来客数</th>
                  <th className="text-right text-xs text-neutral-400 font-medium pb-2">期間中 売上</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {productSaleStats.map((ps) => (
                  <tr key={ps.name}>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-neutral-800 dark:text-neutral-200 font-medium">{ps.name}</span>
                        {ps.status === "終了" && (
                          <span className="text-[10px] text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">終了</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-neutral-500">
                      {ps.sale_start ?? "〜"} 〜 {ps.sale_end ?? "現在"}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                      {ps.customers > 0 ? `${ps.customers.toLocaleString()}人` : "—"}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                      {ps.amount > 0 ? `¥${ps.amount.toLocaleString()}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-400 mt-3">
            ※ 来客数・売上は店舗全体の数値です。特定商品の個別販売数は「会計 → 売上管理」の明細から確認できます。
          </p>
        </div>
      )}

      <p className="text-xs text-neutral-400">
        来客数は「売上管理」、PR活動は「PR活動」の登録内容から集計されます。
        キャンペーン効果の変化率は開始30日前との日平均来客数比較です。
      </p>
    </div>
  );
}
