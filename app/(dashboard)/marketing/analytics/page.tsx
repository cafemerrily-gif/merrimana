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

  const sixMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(year, month - 1 - (5 - i), 1);
    return getMonthRange(d.getFullYear(), d.getMonth() + 1);
  });
  const oldest = sixMonths[0];

  let dbError = false;
  let monthlyData: { label: string; customers: number; prCount: number }[] = [];
  let channelSummary: { channel: string; count: number; completed: number }[] = [];
  let activeCampaigns: { title: string; start_date: string | null; end_date: string | null }[] = [];
  let upcomingPr: { title: string; channel: string; scheduled_at: string }[] = [];
  let totalCustomers = 0;
  let totalPrActivities = 0;
  let completedPrActivities = 0;

  try {
    const supabase = await createClient();

    const [{ data: salesData }, { data: prData }, { data: campaignsData }] = await Promise.all([
      supabase
        .from("sales")
        .select("date, customer_count")
        .gte("date", oldest.start),
      supabase
        .from("pr_activities")
        .select("channel, status, scheduled_at, title"),
      supabase
        .from("campaigns")
        .select("title, start_date, end_date, status")
        .eq("status", "実施中"),
    ]);

    // 月別来客数
    const customersByMonth = new Map<string, number>();
    (salesData ?? []).forEach((s) => {
      const key = s.date.slice(0, 7);
      customersByMonth.set(key, (customersByMonth.get(key) ?? 0) + (s.customer_count ?? 0));
    });
    totalCustomers = Array.from(customersByMonth.values()).reduce((s, v) => s + v, 0);

    // PR活動の月別カウント（scheduled_at がある活動のみ）
    const prByMonth = new Map<string, number>();
    (prData ?? []).forEach((p) => {
      if (p.scheduled_at) {
        const key = p.scheduled_at.slice(0, 7);
        if (sixMonths.some((m) => m.key === key)) {
          prByMonth.set(key, (prByMonth.get(key) ?? 0) + 1);
        }
      }
    });

    monthlyData = sixMonths.map((m) => ({
      label: m.label,
      customers: customersByMonth.get(m.key) ?? 0,
      prCount: prByMonth.get(m.key) ?? 0,
    }));

    // チャネル別集計
    const channelMap = new Map<string, { count: number; completed: number }>();
    (prData ?? []).forEach((p) => {
      const prev = channelMap.get(p.channel) ?? { count: 0, completed: 0 };
      channelMap.set(p.channel, {
        count: prev.count + 1,
        completed: prev.completed + (p.status === "完了" ? 1 : 0),
      });
    });
    channelSummary = Array.from(channelMap.entries())
      .map(([channel, v]) => ({ channel, ...v }))
      .sort((a, b) => b.count - a.count);

    totalPrActivities = (prData ?? []).length;
    completedPrActivities = (prData ?? []).filter((p) => p.status === "完了").length;
    activeCampaigns = campaignsData ?? [];

    // 今後の予定PR活動（予定のもの）
    const todayStr = now.toISOString().slice(0, 10);
    upcomingPr = (prData ?? [])
      .filter((p) => p.status === "予定" && p.scheduled_at && p.scheduled_at >= todayStr)
      .sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""))
      .slice(0, 5)
      .map((p) => ({ title: p.title, channel: p.channel, scheduled_at: p.scheduled_at! }));
  } catch {
    dbError = true;
  }

  const maxBar = Math.max(...monthlyData.map((d) => d.customers), 1);

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
              { label: "直近6ヶ月 累計来客", value: `${totalCustomers.toLocaleString()}人` },
              { label: "PR活動 合計", value: `${totalPrActivities}件` },
              { label: "PR活動 完了", value: `${completedPrActivities}件` },
              { label: "実施中キャンペーン", value: `${activeCampaigns.length}件` },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4"
              >
                <p className="text-xs text-neutral-400 mb-1">{label}</p>
                <p className="text-xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* 月別来客数グラフ */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
            <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
              月別来客数（直近6ヶ月）
            </h2>
            {monthlyData.every((d) => d.customers === 0) ? (
              <p className="text-sm text-neutral-400 text-center py-8">
                売上管理で来客数を入力するとグラフが表示されます。
              </p>
            ) : (
              <>
                <div className="flex items-end gap-4 h-40">
                  {monthlyData.map(({ label, customers, prCount }) => (
                    <div key={label} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col items-center justify-end" style={{ height: "100px" }}>
                        <div
                          className="w-full rounded-t bg-blue-500 dark:bg-blue-600 transition-all"
                          style={{ height: `${Math.max((customers / maxBar) * 100, customers > 0 ? 2 : 0)}%` }}
                          title={`来客数 ${customers}人`}
                        />
                      </div>
                      <span className="text-xs text-neutral-400">{label}</span>
                      {prCount > 0 && (
                        <span className="text-xs text-green-500 font-medium">PR {prCount}件</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-2.5 rounded bg-blue-500 inline-block" />来客数
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-green-500 font-medium">PR N件</span>
                    <span>= その月に実施予定のPR活動数</span>
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* チャネル別PR活動 */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
              <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
                チャネル別PR活動数
              </h2>
              {channelSummary.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-6">
                  PR活動を登録するとここに表示されます。
                </p>
              ) : (
                <div className="space-y-3">
                  {channelSummary.map(({ channel, count, completed }) => {
                    const pct = totalPrActivities > 0 ? (count / totalPrActivities) * 100 : 0;
                    const completionRate = count > 0 ? Math.round((completed / count) * 100) : 0;
                    return (
                      <div key={channel}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-neutral-700 dark:text-neutral-300">
                            {channel}
                          </span>
                          <span className="text-neutral-500 tabular-nums text-xs">
                            {count}件 · 完了率 {completionRate}%
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

            {/* 今後の予定 */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
              <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
                今後のPR予定
              </h2>
              {upcomingPr.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-6">
                  今後予定されているPR活動はありません。
                </p>
              ) : (
                <div className="space-y-2">
                  {upcomingPr.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between gap-2 py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                    >
                      <div>
                        <p className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">
                          {p.title}
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">{p.channel}</p>
                      </div>
                      <p className="text-xs text-neutral-400 shrink-0">{p.scheduled_at}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeCampaigns.length > 0 && (
                <>
                  <h3 className="text-xs font-semibold text-neutral-500 mt-4 mb-2 uppercase tracking-wider">
                    実施中キャンペーン
                  </h3>
                  <div className="space-y-1">
                    {activeCampaigns.map((c) => (
                      <div
                        key={c.title}
                        className="flex items-center justify-between gap-2"
                      >
                        <p className="text-sm text-neutral-700 dark:text-neutral-300 truncate">
                          {c.title}
                        </p>
                        {(c.start_date || c.end_date) && (
                          <p className="text-xs text-neutral-400 shrink-0">
                            〜 {c.end_date ?? "—"}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <p className="text-xs text-neutral-400">
            ※ 来客数は「売上管理」、PR活動は「PR活動」の登録内容から集計されます。
          </p>
        </>
      )}
    </div>
  );
}
