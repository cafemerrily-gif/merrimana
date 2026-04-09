const PL_ROWS = [
  { label: "売上高", value: 2841000, indent: 0, bold: true, type: "revenue" },
  { label: "売上原価（材料費）", value: 854000, indent: 1, bold: false, type: "cost" },
  { label: "売上総利益", value: 1987000, indent: 0, bold: true, type: "subtotal" },
  { label: "販売費及び一般管理費", value: null, indent: 0, bold: true, type: "header" },
  { label: "人件費", value: 730000, indent: 1, bold: false, type: "expense" },
  { label: "家賃", value: 280000, indent: 1, bold: false, type: "expense" },
  { label: "光熱費", value: 87000, indent: 1, bold: false, type: "expense" },
  { label: "消耗品費", value: 12400, indent: 1, bold: false, type: "expense" },
  { label: "修繕費", value: 35000, indent: 1, bold: false, type: "expense" },
  { label: "その他", value: 151600, indent: 1, bold: false, type: "expense" },
  { label: "販管費合計", value: 1296000, indent: 0, bold: true, type: "subtotal" },
  { label: "営業利益", value: 691000, indent: 0, bold: true, type: "profit" },
  { label: "営業外収益", value: 5000, indent: 1, bold: false, type: "revenue" },
  { label: "営業外費用", value: 0, indent: 1, bold: false, type: "expense" },
  { label: "経常利益", value: 696000, indent: 0, bold: true, type: "profit" },
  { label: "法人税等（概算）", value: 208800, indent: 1, bold: false, type: "expense" },
  { label: "当期純利益", value: 487200, indent: 0, bold: true, type: "profit" },
];

const PREV_MONTH: Record<string, number> = {
  "売上高": 2600000,
  "売上原価（材料費）": 800000,
  "売上総利益": 1800000,
  "人件費": 710000,
  "家賃": 280000,
  "光熱費": 90000,
  "消耗品費": 15000,
  "修繕費": 0,
  "その他": 140000,
  "販管費合計": 1235000,
  "営業利益": 565000,
  "経常利益": 570000,
  "当期純利益": 399000,
};

function formatVal(v: number | null) {
  if (v === null) return "";
  if (v === 0) return "—";
  return `¥${v.toLocaleString()}`;
}

function diff(label: string, current: number | null) {
  if (current === null || !(label in PREV_MONTH)) return null;
  return current - PREV_MONTH[label];
}

export default function PLPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">損益計算書</h1>
        <p className="text-sm text-neutral-500 mt-0.5">2026年3月度（確定）</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "売上高", value: "¥2,841,000", sub: "前月比 +9.3%" },
          { label: "営業利益率", value: "24.3%", sub: "前月 21.7%" },
          { label: "当期純利益", value: "¥487,200", sub: "前月比 +22.1%" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
            <p className="text-xs text-neutral-400 mb-1">{label}</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
            <p className="text-xs text-blue-500 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* P&L テーブル */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
              <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">項目</th>
              <th className="text-right px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">今月</th>
              <th className="text-right px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 hidden md:table-cell">前月</th>
              <th className="text-right px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 hidden md:table-cell">増減</th>
            </tr>
          </thead>
          <tbody>
            {PL_ROWS.map((row) => {
              const d = diff(row.label, row.value);
              return (
                <tr
                  key={row.label}
                  className={`border-b border-neutral-100 dark:border-neutral-800 last:border-0
                    ${row.type === "profit" ? "bg-blue-50 dark:bg-blue-900/10" : ""}
                    ${row.type === "header" ? "bg-neutral-50 dark:bg-neutral-800/50" : ""}
                  `}
                >
                  <td className={`px-4 py-2.5 ${row.bold ? "font-semibold" : ""} text-neutral-${row.indent === 1 ? "500 dark:text-neutral-400" : "800 dark:text-neutral-200"}`}
                    style={{ paddingLeft: `${(row.indent + 1) * 16}px` }}>
                    {row.label}
                  </td>
                  <td className={`px-4 py-2.5 text-right tabular-nums ${row.bold ? "font-semibold" : ""} ${row.type === "profit" ? "text-blue-600 dark:text-blue-400" : "text-neutral-700 dark:text-neutral-300"}`}>
                    {formatVal(row.value)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-neutral-400 hidden md:table-cell">
                    {row.value !== null && PREV_MONTH[row.label] !== undefined
                      ? `¥${PREV_MONTH[row.label].toLocaleString()}`
                      : ""}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums hidden md:table-cell">
                    {d !== null && d !== 0 ? (
                      <span className={d > 0 ? "text-blue-500" : "text-red-400"}>
                        {d > 0 ? "+" : ""}¥{d.toLocaleString()}
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
