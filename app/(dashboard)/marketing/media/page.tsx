import { Upload, Image as ImageIcon, FileText, Film } from "lucide-react";

const MEDIA = [
  { id: 1, name: "spring_morning_fair.jpg", type: "image", size: "2.4MB", date: "2026/04/01", tags: ["春フェア", "Instagram"] },
  { id: 2, name: "croissant_sandwich.jpg", type: "image", size: "1.8MB", date: "2026/04/01", tags: ["新商品", "Instagram"] },
  { id: 3, name: "stamp_double_day.png", type: "image", size: "0.9MB", date: "2026/03/28", tags: ["キャンペーン", "X"] },
  { id: 4, name: "gw_promo_video.mp4", type: "video", size: "24.1MB", date: "2026/03/25", tags: ["GW", "リール"] },
  { id: 5, name: "cafe_interior_01.jpg", type: "image", size: "3.2MB", date: "2026/03/20", tags: ["店内", "汎用"] },
  { id: 6, name: "menu_spring2026.pdf", type: "pdf", size: "1.1MB", date: "2026/03/15", tags: ["メニュー", "印刷"] },
  { id: 7, name: "cheesecake_detail.jpg", type: "image", size: "2.1MB", date: "2026/03/10", tags: ["フード", "商品写真"] },
  { id: 8, name: "logo_white.png", type: "image", size: "0.2MB", date: "2026/01/01", tags: ["ブランド"] },
];

const typeIcon = (type: string) => {
  if (type === "video") return Film;
  if (type === "pdf") return FileText;
  return ImageIcon;
};

const typeBg: Record<string, string> = {
  image: "bg-blue-100 dark:bg-blue-900/30",
  video: "bg-purple-100 dark:bg-purple-900/30",
  pdf: "bg-orange-100 dark:bg-orange-900/30",
};

const typeColor: Record<string, string> = {
  image: "text-blue-500",
  video: "text-purple-500",
  pdf: "text-orange-500",
};

export default function MediaPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">メディア素材</h1>
          <p className="text-sm text-neutral-500 mt-0.5">広報・マーケティングユニット</p>
        </div>
        <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Upload size={15} />
          アップロード
        </button>
      </div>

      {/* フィルタ */}
      <div className="flex gap-1.5">
        {["すべて", "画像", "動画", "PDF"].map((f, i) => (
          <button
            key={f}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              i === 0
                ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-transparent"
                : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* グリッド */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {MEDIA.map((file) => {
          const Icon = typeIcon(file.type);
          return (
            <div
              key={file.id}
              className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer"
            >
              <div className={`h-24 flex items-center justify-center ${typeBg[file.type]}`}>
                <Icon size={32} className={typeColor[file.type]} />
              </div>
              <div className="p-2.5">
                <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate">{file.name}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{file.size} · {file.date}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {file.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-neutral-400">{MEDIA.length}件のファイル</p>
    </div>
  );
}
