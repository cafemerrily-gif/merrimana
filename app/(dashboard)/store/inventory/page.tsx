"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

type Item = {
  id: number;
  name: string;
  category: string;
  current: number;
  min: number;
  max: number;
  unit: string;
};

const INITIAL_INVENTORY: Item[] = [
  { id: 1, name: "コーヒー豆（エチオピア）", category: "コーヒー", current: 8.2, min: 5, max: 25, unit: "kg" },
  { id: 2, name: "コーヒー豆（ブラジル）", category: "コーヒー", current: 3.1, min: 5, max: 20, unit: "kg" },
  { id: 3, name: "牛乳", category: "乳製品", current: 18, min: 10, max: 40, unit: "L" },
  { id: 4, name: "生クリーム", category: "乳製品", current: 2.5, min: 3, max: 10, unit: "L" },
  { id: 5, name: "抹茶パウダー", category: "パウダー", current: 0.4, min: 0.5, max: 2, unit: "kg" },
  { id: 6, name: "バター", category: "乳製品", current: 2.0, min: 1, max: 5, unit: "kg" },
  { id: 7, name: "小麦粉", category: "製菓材料", current: 12, min: 5, max: 20, unit: "kg" },
  { id: 8, name: "グラニュー糖", category: "製菓材料", current: 7.5, min: 3, max: 15, unit: "kg" },
  { id: 9, name: "テイクアウトカップ（M）", category: "資材", current: 120, min: 100, max: 500, unit: "個" },
  { id: 10, name: "テイクアウトカップ（L）", category: "資材", current: 45, min: 100, max: 400, unit: "個" },
];

function getStatus(item: Item): "ok" | "low" | "critical" {
  const ratio = item.current / item.min;
  if (ratio < 1) return "critical";
  if (ratio < 1.5) return "low";
  return "ok";
}

const statusLabel = { ok: "適正", low: "少なめ", critical: "不足" };
const statusStyle = {
  ok: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  low: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  critical: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

export default function InventoryPage() {
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const criticalItems = inventory.filter((i) => getStatus(i) === "critical");

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">在庫チェック</h1>
        <p className="text-sm text-neutral-500 mt-0.5">店舗スタッフユニット</p>
      </div>

      {/* アラート */}
      {criticalItems.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10 p-4">
          <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">在庫不足のアイテムがあります</p>
            <p className="text-xs text-red-500 mt-0.5">
              {criticalItems.map((i) => i.name).join("、")} — 発注が必要です
            </p>
          </div>
        </div>
      )}

      {/* 在庫テーブル */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
              <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">品名</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 hidden sm:table-cell">カテゴリ</th>
              <th className="text-right px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">在庫量</th>
              <th className="text-center px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">状態</th>
              <th className="px-4 py-3 w-36 hidden lg:table-cell" />
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => {
              const status = getStatus(item);
              const pct = Math.min(100, (item.current / item.max) * 100);
              const barColor = status === "critical" ? "bg-red-400" : status === "low" ? "bg-yellow-400" : "bg-blue-500";
              return (
                <tr key={item.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{item.name}</td>
                  <td className="px-4 py-3 text-neutral-500 hidden sm:table-cell">{item.category}</td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="number"
                      value={item.current}
                      step="0.1"
                      min="0"
                      onChange={(e) =>
                        setInventory((prev) =>
                          prev.map((i) =>
                            i.id === item.id ? { ...i, current: parseFloat(e.target.value) || 0 } : i
                          )
                        )
                      }
                      className="w-20 text-right tabular-nums rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <span className="text-xs text-neutral-400 ml-1">{item.unit}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle[status]}`}>
                      {statusLabel[status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-neutral-400 mt-0.5">
                      <span>0</span>
                      <span>MAX {item.max}{item.unit}</span>
                    </div>
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
