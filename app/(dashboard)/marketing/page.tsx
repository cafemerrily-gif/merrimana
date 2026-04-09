import { Plus, Calendar, Tag } from "lucide-react";

const CAMPAIGNS = [
  {
    id: 1,
    title: "春のモーニングフェア",
    description: "9:00〜11:00限定。モーニングセットを20%オフ。新商品のクロワッサンサンドを同時展開。",
    period: "2026/04/01 〜 04/30",
    status: "実施中",
    tags: ["割引", "モーニング"],
  },
  {
    id: 2,
    title: "ゴールデンウィーク特別メニュー",
    description: "期間限定のフルーツタルトと抹茶パフェを提供。テイクアウト専用パッケージも用意。",
    period: "2026/04/29 〜 05/06",
    status: "準備中",
    tags: ["限定メニュー", "テイクアウト"],
  },
  {
    id: 3,
    title: "スタンプカード2倍デー",
    description: "毎週水曜日にスタンプカードのポイントが2倍になるキャンペーン。",
    period: "2026/04/01 〜 継続中",
    status: "実施中",
    tags: ["ポイント", "リピーター"],
  },
  {
    id: 4,
    title: "バレンタイン限定チョコドリンク",
    description: "期間限定のショコララテ・ホットチョコレートを販売。",
    period: "2026/02/01 〜 02/14",
    status: "終了",
    tags: ["季節限定", "ドリンク"],
  },
];

const statusStyle: Record<string, string> = {
  実施中: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  準備中: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  終了: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
};

export default function MarketingPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">キャンペーン管理</h1>
          <p className="text-sm text-neutral-500 mt-0.5">広報・マーケティングユニット</p>
        </div>
        <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={15} />
          新規作成
        </button>
      </div>

      {/* ステータスサマリー */}
      <div className="flex gap-3">
        {[
          { label: "実施中", count: CAMPAIGNS.filter((c) => c.status === "実施中").length, active: true },
          { label: "準備中", count: CAMPAIGNS.filter((c) => c.status === "準備中").length, active: false },
          { label: "終了", count: CAMPAIGNS.filter((c) => c.status === "終了").length, active: false },
        ].map(({ label, count, active }) => (
          <div
            key={label}
            className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 text-center"
          >
            <p className={`text-2xl font-bold ${active ? "text-blue-600" : "text-neutral-700 dark:text-neutral-300"}`}>
              {count}
            </p>
            <p className="text-xs text-neutral-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* キャンペーン一覧 */}
      <div className="space-y-3">
        {CAMPAIGNS.map((campaign) => (
          <div
            key={campaign.id}
            className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{campaign.title}</h3>
              <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle[campaign.status]}`}>
                {campaign.status}
              </span>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">{campaign.description}</p>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-neutral-400">
                <Calendar size={12} />
                {campaign.period}
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {campaign.tags.map((tag) => (
                  <div key={tag} className="flex items-center gap-0.5 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                    <Tag size={10} />
                    {tag}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
