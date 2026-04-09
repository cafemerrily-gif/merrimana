const CALENDAR_DAYS = ["月", "火", "水", "木", "金", "土", "日"];

const DUMMY_EVENTS: Record<number, string[]> = {
  3: ["仕込み"],
  7: ["スタッフMTG"],
  12: ["新メニュー試作"],
  15: ["月次報告"],
  20: ["棚卸し"],
  25: ["給与締め"],
};

const DUMMY_SALES = [
  { label: "本日の売上", value: "¥128,400", change: "+8.2%", up: true },
  { label: "今週の売上", value: "¥743,200", change: "+3.5%", up: true },
  { label: "今月の売上", value: "¥2,841,000", change: "-1.2%", up: false },
  { label: "客単価（本日）", value: "¥1,284", change: "+120", up: true },
];

function CalendarCard() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const todayDate = today.getDate();

  const firstDay = new Date(year, month, 1).getDay();
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(adjustedFirstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLabel = `${year}年${month + 1}月`;

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 dark:border-neutral-800">
        <h2 className="font-semibold text-neutral-800 dark:text-neutral-200">
          {monthLabel}
        </h2>
        <span className="text-xs text-neutral-400">全体カレンダー</span>
      </div>
      <div className="p-4">
        {/* 曜日ヘッダ */}
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
        {/* 日付グリッド */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;
            const isToday = day === todayDate;
            const events = DUMMY_EVENTS[day] ?? [];
            const col = idx % 7;
            return (
              <div key={day} className="flex flex-col items-center gap-0.5">
                <div
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-sm cursor-pointer transition-colors
                    ${isToday ? "bg-blue-600 text-white font-bold" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"}
                    ${col === 5 && !isToday ? "text-blue-500" : ""}
                    ${col === 6 && !isToday ? "text-red-400" : ""}
                  `}
                >
                  {day}
                </div>
                {events.length > 0 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                )}
              </div>
            );
          })}
        </div>
        {/* イベントリスト */}
        {Object.entries(DUMMY_EVENTS).length > 0 && (
          <div className="mt-4 space-y-1">
            <p className="text-xs font-medium text-neutral-400 mb-2">
              今月のイベント
            </p>
            {Object.entries(DUMMY_EVENTS).map(([d, evs]) => (
              <div key={d} className="flex items-center gap-2 text-xs">
                <span className="w-6 text-right text-neutral-500">{d}日</span>
                <div className="w-1 h-1 rounded-full bg-blue-500 shrink-0" />
                <span className="text-neutral-700 dark:text-neutral-300">
                  {evs.join(", ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SalesCard({
  label,
  value,
  change,
  up,
}: {
  label: string;
  value: string;
  change: string;
  up: boolean;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      <p className="text-xs text-neutral-400 mb-1">{label}</p>
      <p className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
        {value}
      </p>
      <p
        className={`text-xs mt-1 font-medium ${
          up ? "text-blue-500" : "text-red-400"
        }`}
      >
        {up ? "▲" : "▼"} {change} 前日比
      </p>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
          ダッシュボード
        </h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          メリリーカフェの運営状況
        </p>
      </div>

      {/* 売上サマリー */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
          売上サマリー
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {DUMMY_SALES.map((s) => (
            <SalesCard key={s.label} {...s} />
          ))}
        </div>
      </section>

      {/* カレンダー */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
          カレンダー
        </h2>
        <CalendarCard />
      </section>
    </div>
  );
}
