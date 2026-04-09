const DAYS = ["月\n4/6", "火\n4/7", "水\n4/8", "木\n4/9", "金\n4/10", "土\n4/11", "日\n4/12"];

const STAFF = [
  {
    name: "伊藤 花",
    role: "ホール",
    shifts: ["09:00-14:00", "09:00-14:00", "—", "09:00-15:00", "—", "10:00-17:00", "—"],
  },
  {
    name: "渡辺 大輔",
    role: "キッチン",
    shifts: ["10:00-17:00", "—", "09:00-15:00", "09:00-15:00", "10:00-17:00", "—", "10:00-16:00"],
  },
  {
    name: "山田 美咲",
    role: "ホール",
    shifts: ["—", "13:00-19:00", "13:00-19:00", "13:00-18:00", "13:00-19:00", "09:00-15:00", "—"],
  },
  {
    name: "小林 翔",
    role: "キッチン",
    shifts: ["14:00-19:00", "14:00-19:00", "—", "14:00-19:00", "14:00-19:00", "13:00-19:00", "11:00-18:00"],
  },
  {
    name: "中村 優",
    role: "ホール",
    shifts: ["—", "—", "10:00-17:00", "—", "09:00-14:00", "10:00-17:00", "10:00-17:00"],
  },
];

const TODAY_IDX = 3; // 木曜日（4/9）

export default function ShiftPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">シフト管理</h1>
        <p className="text-sm text-neutral-500 mt-0.5">2026年4月 第2週</p>
      </div>

      {/* 週次シフト表 */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 min-w-32">スタッフ</th>
                {DAYS.map((day, i) => (
                  <th
                    key={day}
                    className={`px-3 py-3 text-center font-medium text-xs whitespace-pre-line min-w-24 ${
                      i === TODAY_IDX
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10"
                        : "text-neutral-500 dark:text-neutral-400"
                    }`}
                  >
                    {day}
                    {i === TODAY_IDX && (
                      <span className="block text-xs font-bold">今日</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STAFF.map((s) => (
                <tr key={s.name} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{s.name}</p>
                    <p className="text-xs text-neutral-400">{s.role}</p>
                  </td>
                  {s.shifts.map((shift, i) => (
                    <td
                      key={i}
                      className={`px-3 py-2.5 text-center text-xs ${
                        i === TODAY_IDX ? "bg-blue-50 dark:bg-blue-900/10" : ""
                      }`}
                    >
                      {shift === "—" ? (
                        <span className="text-neutral-300 dark:text-neutral-600">—</span>
                      ) : (
                        <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded px-1.5 py-0.5 tabular-nums whitespace-nowrap">
                          {shift}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 本日の人員 */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">本日（4/9）の出勤予定</h2>
        <div className="flex gap-3 flex-wrap">
          {STAFF.filter((s) => s.shifts[TODAY_IDX] !== "—").map((s) => (
            <div key={s.name} className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <div>
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{s.name}</p>
                <p className="text-xs text-neutral-400">{s.role} · {s.shifts[TODAY_IDX]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
