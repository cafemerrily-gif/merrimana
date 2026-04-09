import { Plus, Camera, MessageCircle, ExternalLink } from "lucide-react";

const POSTS = [
  {
    id: 1,
    platform: "Instagram",
    content: "🌸 春のモーニングフェア開催中！\n9〜11時限定でモーニングセット20%オフ。新作クロワッサンサンドも登場しました。ぜひお越しください☕",
    scheduledAt: "2026/04/10 09:00",
    status: "予約済",
    image: true,
  },
  {
    id: 2,
    platform: "X（Twitter）",
    content: "【新商品】季節のタルトが登場🍓 ストロベリーとカスタードの組み合わせが絶品です。数量限定なのでお早めに！#メリリーカフェ #新メニュー",
    scheduledAt: "2026/04/11 12:00",
    status: "予約済",
    image: false,
  },
  {
    id: 3,
    platform: "Instagram",
    content: "毎週水曜はスタンプ2倍デー✨\nスタンプカードをお持ちの方はぜひ水曜日にご来店ください！10個たまるとドリンク1杯無料です。",
    scheduledAt: "2026/04/08 11:00",
    status: "投稿済",
    image: true,
  },
  {
    id: 4,
    platform: "X（Twitter）",
    content: "GW期間（4/29〜5/6）は特別メニューを提供予定🎉 詳細は近日公開！フォローしてお見逃しなく。",
    scheduledAt: "2026/04/15 10:00",
    status: "下書き",
    image: false,
  },
];

const statusStyle: Record<string, string> = {
  予約済: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  投稿済: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  下書き: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

const platformIcon = (platform: string) =>
  platform === "Instagram" ? Camera : MessageCircle;

export default function SNSPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">SNS管理</h1>
          <p className="text-sm text-neutral-500 mt-0.5">広報・マーケティングユニット</p>
        </div>
        <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={15} />
          投稿を作成
        </button>
      </div>

      {/* プラットフォーム別サマリー */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { platform: "Instagram", icon: Camera, followers: "1,284", posts: 2 },
          { platform: "X（Twitter）", icon: MessageCircle, followers: "842", posts: 2 },
        ].map(({ platform, icon: Icon, followers, posts }) => (
          <div key={platform} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon size={18} className="text-neutral-600 dark:text-neutral-400" />
              <span className="font-medium text-sm text-neutral-700 dark:text-neutral-300">{platform}</span>
            </div>
            <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{followers}</p>
            <p className="text-xs text-neutral-400 mt-0.5">フォロワー</p>
            <p className="text-xs text-blue-500 mt-1">{posts}件 予約中</p>
          </div>
        ))}
      </div>

      {/* 投稿一覧 */}
      <div className="space-y-3">
        {POSTS.map((post) => {
          const Icon = platformIcon(post.platform);
          return (
            <div key={post.id} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Icon size={15} className="text-neutral-500 shrink-0" />
                  <span className="text-xs text-neutral-500">{post.platform}</span>
                  <span className="text-xs text-neutral-400">· {post.scheduledAt}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle[post.status]}`}>
                    {post.status}
                  </span>
                  <button className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors">
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line leading-relaxed">
                {post.content}
              </p>
              {post.image && (
                <div className="mt-2 w-16 h-16 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs text-neutral-400">
                  画像
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
