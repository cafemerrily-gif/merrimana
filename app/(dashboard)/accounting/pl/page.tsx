import { createClient } from "@/utils/supabase/server";

type PLRow = {
  label: string;
  value: number | null;
  prevValue: number | null;
  indent: number;
  bold: boolean;
  type: "revenue" | "cost" | "subtotal" | "header" | "expense" | "profit";
};

function sumExpensesByCategory(
  expenses: { category: string; amount: number }[],
  category: string
): number {
  return expenses.filter((e) => e.category === category).reduce((s, e) => s + e.amount, 0);
}

function sumOtherExpenses(
  expenses: { category: string; amount: number }[],
  knownCategories: string[]
): number {
  return expenses
    .filter((e) => !knownCategories.includes(e.category))
    .reduce((s, e) => s + e.amount, 0);
}

export default async function PLPage() {
  const supabase = await createClient();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const pad = (n: number) => String(n).padStart(2, "0");

  const curStart = `${year}-${pad(month)}-01`;
  const curEnd = `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`;

  const prevDate = new Date(year, month - 2, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth() + 1;
  const prevStart = `${prevYear}-${pad(prevMonth)}-01`;
  const prevEnd = `${prevYear}-${pad(prevMonth)}-${pad(new Date(prevYear, prevMonth, 0).getDate())}`;

  let dbError = false;
  let rows: PLRow[] = [];
  let curMonthLabel = `${year}年${month}月`;
  let prevMonthLabel = `${prevYear}年${prevMonth}月`;

  try {
    const [
      { data: curSales },
      { data: curExpenses },
      { data: prevSales },
      { data: prevExpenses },
    ] = await Promise.all([
      supabase.from("sales").select("amount").gte("date", curStart).lte("date", curEnd),
      supabase
        .from("expenses")
        .select("category, amount")
        .gte("date", curStart)
        .lte("date", curEnd),
      supabase.from("sales").select("amount").gte("date", prevStart).lte("date", prevEnd),
      supabase
        .from("expenses")
        .select("category, amount")
        .gte("date", prevStart)
        .lte("date", prevEnd),
    ]);

    const sumSales = (data: { amount: number }[] | null) =>
      (data ?? []).reduce((s, r) => s + r.amount, 0);

    const cSales = sumSales(curSales);
    const pSales = sumSales(prevSales);

    const cExp = curExpenses ?? [];
    const pExp = prevExpenses ?? [];

    const knownCats = ["原材料費", "人件費", "家賃", "光熱費", "消耗品費", "修繕費"];

    const cRawMat = sumExpensesByCategory(cExp, "原材料費");
    const pRawMat = sumExpensesByCategory(pExp, "原材料費");
    const cGrossProfit = cSales - cRawMat;
    const pGrossProfit = pSales - pRawMat;

    const cLabor = sumExpensesByCategory(cExp, "人件費");
    const pLabor = sumExpensesByCategory(pExp, "人件費");
    const cRent = sumExpensesByCategory(cExp, "家賃");
    const pRent = sumExpensesByCategory(pExp, "家賃");
    const cUtil = sumExpensesByCategory(cExp, "光熱費");
    const pUtil = sumExpensesByCategory(pExp, "光熱費");
    const cConsumable = sumExpensesByCategory(cExp, "消耗品費");
    const pConsumable = sumExpensesByCategory(pExp, "消耗品費");
    const cRepair = sumExpensesByCategory(cExp, "修繕費");
    const pRepair = sumExpensesByCategory(pExp, "修繕費");
    const cOther = sumOtherExpenses(cExp, knownCats);
    const pOther = sumOtherExpenses(pExp, knownCats);

    const cSgaTotal = cLabor + cRent + cUtil + cConsumable + cRepair + cOther;
    const pSgaTotal = pLabor + pRent + pUtil + pConsumable + pRepair + pOther;

    const cOpProfit = cGrossProfit - cSgaTotal;
    const pOpProfit = pGrossProfit - pSgaTotal;

    rows = [
      { label: "売上高", value: cSales, prevValue: pSales, indent: 0, bold: true, type: "revenue" },
      { label: "売上原価（材料費）", value: cRawMat, prevValue: pRawMat, indent: 1, bold: false, type: "cost" },
      { label: "売上総利益", value: cGrossProfit, prevValue: pGrossProfit, indent: 0, bold: true, type: "subtotal" },
      { label: "販売費及び一般管理費", value: null, prevValue: null, indent: 0, bold: true, type: "header" },
      { label: "人件費", value: cLabor, prevValue: pLabor, indent: 1, bold: false, type: "expense" },
      { label: "家賃", value: cRent, prevValue: pRent, indent: 1, bold: false, type: "expense" },
      { label: "光熱費", value: cUtil, prevValue: pUtil, indent: 1, bold: false, type: "expense" },
      { label: "消耗品費", value: cConsumable, prevValue: pConsumable, indent: 1, bold: false, type: "expense" },
      { label: "修繕費", value: cRepair, prevValue: pRepair, indent: 1, bold: false, type: "expense" },
      { label: "その他経費", value: cOther, prevValue: pOther, indent: 1, bold: false, type: "expense" },
      { label: "販管費合計", value: cSgaTotal, prevValue: pSgaTotal, indent: 0, bold: true, type: "subtotal" },
      { label: "営業利益", value: cOpProfit, prevValue: pOpProfit, indent: 0, bold: true, type: "profit" },
    ];
  } catch {
    dbError = true;
  }

  const cSalesRow = rows.find((r) => r.label === "売上高");
  const cOpRow = rows.find((r) => r.label === "営業利益");
  const opMargin =
    cSalesRow?.value && cOpRow?.value != null && cSalesRow.value > 0
      ? ((cOpRow.value / cSalesRow.value) * 100).toFixed(1)
      : null;

  const prevOpMargin =
    cSalesRow?.prevValue && cOpRow?.prevValue != null && cSalesRow.prevValue > 0
      ? ((cOpRow.prevValue / cSalesRow.prevValue) * 100).toFixed(1)
      : null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">損益計算書</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          {curMonthLabel}度（売上・支出の登録データより自動計算）
        </p>
      </div>

      {dbError ? (
        <div className="py-16 text-center text-sm text-neutral-400 rounded-xl border border-neutral-200 dark:border-neutral-800">
          データを取得できませんでした。Supabaseの接続設定を確認してください。
        </div>
      ) : (
        <>
          {/* KPI */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "売上高",
                value: cSalesRow?.value != null ? `¥${cSalesRow.value.toLocaleString()}` : "—",
                sub: cSalesRow?.prevValue
                  ? `前月 ¥${cSalesRow.prevValue.toLocaleString()}`
                  : "前月データなし",
              },
              {
                label: "営業利益率",
                value: opMargin ? `${opMargin}%` : "—",
                sub: prevOpMargin ? `前月 ${prevOpMargin}%` : "前月データなし",
              },
              {
                label: "営業利益",
                value: cOpRow?.value != null ? `¥${cOpRow.value.toLocaleString()}` : "—",
                sub: cOpRow?.prevValue
                  ? `前月 ¥${cOpRow.prevValue.toLocaleString()}`
                  : "前月データなし",
              },
            ].map(({ label, value, sub }) => (
              <div
                key={label}
                className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4"
              >
                <p className="text-xs text-neutral-400 mb-1">{label}</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
                <p className="text-xs text-neutral-400 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* P&L テーブル */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                  <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                    項目
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                    {curMonthLabel}
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 hidden md:table-cell">
                    {prevMonthLabel}
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 hidden md:table-cell">
                    増減
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const diff =
                    row.value != null && row.prevValue != null
                      ? row.value - row.prevValue
                      : null;
                  return (
                    <tr
                      key={row.label}
                      className={[
                        "border-b border-neutral-100 dark:border-neutral-800 last:border-0",
                        row.type === "profit" ? "bg-blue-50 dark:bg-blue-900/10" : "",
                        row.type === "header" ? "bg-neutral-50 dark:bg-neutral-800/50" : "",
                      ].join(" ")}
                    >
                      <td
                        className={`py-2.5 ${row.bold ? "font-semibold" : ""} ${
                          row.indent === 1
                            ? "text-neutral-500 dark:text-neutral-400"
                            : "text-neutral-800 dark:text-neutral-200"
                        }`}
                        style={{ paddingLeft: `${(row.indent + 1) * 16}px`, paddingRight: "16px" }}
                      >
                        {row.label}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right tabular-nums ${row.bold ? "font-semibold" : ""} ${
                          row.type === "profit"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        {row.value != null ? `¥${row.value.toLocaleString()}` : ""}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-neutral-400 hidden md:table-cell">
                        {row.prevValue != null ? `¥${row.prevValue.toLocaleString()}` : ""}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums hidden md:table-cell">
                        {diff != null && diff !== 0 ? (
                          <span className={diff > 0 ? "text-blue-500" : "text-red-400"}>
                            {diff > 0 ? "+" : ""}¥{diff.toLocaleString()}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-neutral-400">
            ※ 売上管理・支出管理に登録されたデータをもとに自動計算されます。
          </p>
        </>
      )}
    </div>
  );
}
