"use client";

import { useState } from "react";
import type { CostRow } from "../page";

const DEFAULT_TARGET = 70;

export default function CostClient({
  rows,
  dbError,
}: {
  rows: CostRow[];
  dbError: boolean;
}) {
  const [target, setTarget] = useState(DEFAULT_TARGET);
  const [inputVal, setInputVal] = useState(String(DEFAULT_TARGET));

  const handleTargetChange = (val: string) => {
    setInputVal(val);
    const n = parseFloat(val);
    if (!isNaN(n) && n > 0 && n <= 100) setTarget(n);
  };

  const avgMargin =
    rows.filter((r) => r.margin !== null).length > 0
      ? rows.reduce((s, r) => s + (r.margin ?? 0), 0) /
        rows.filter((r) => r.margin !== null).length
      : null;

  const belowTarget = rows.filter(
    (r) => r.margin !== null && r.margin < target
  ).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">原価計算</h1>
          <p className="text-sm text-neutral-500 mt-0.5">商品開発ユニット</p>
        </div>
        {/* 目標利益率入力 */}
        <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2">
          <label className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
            目標利益率
          </label>
          <input
            type="number"
            value={inputVal}
            onChange={(e) => handleTargetChange(e.target.value)}
            min="1"
            max="100"
            step="0.5"
            className="w-16 text-right tabular-nums text-sm font-semibold text-neutral-900 dark:text-neutral-100 bg-transparent focus:outline-none"
          />
          <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">%</span>
        </div>
      </div>

      {dbError ? (
        <div className="py-16 text-center text-sm text-neutral-400 rounded-xl border border-neutral-200 dark:border-neutral-800">
          データを取得できませんでした。Supabaseの接続設定を確認してください。
        </div>
      ) : (
        <>
          {/* サマリー */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 text-center">
              <p className={`text-2xl font-bold ${avgMargin !== null && avgMargin >= target ? "text-blue-600 dark:text-blue-400" : "text-red-500"}`}>
                {avgMargin !== null ? `${avgMargin.toFixed(1)}%` : "—"}
              </p>
              <p className="text-xs text-neutral-400 mt-1">平均利益率</p>
            </div>
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 text-center">
              <p className="text-2xl font-bold text-neutral-700 dark:text-neutral-300">
                {target}%
              </p>
              <p className="text-xs text-neutral-400 mt-1">目標利益率</p>
            </div>
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 text-center">
              <p className={`text-2xl font-bold ${belowTarget > 0 ? "text-red-500" : "text-blue-500"}`}>
                {belowTarget}品
              </p>
              <p className="text-xs text-neutral-400 mt-1">基準未達</p>
            </div>
          </div>

          {/* テーブル */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
            {rows.length === 0 ? (
              <div className="py-16 text-center text-sm text-neutral-400">
                商品・レシピを登録すると原価が自動計算されます。
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                    <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">商品名</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 hidden sm:table-cell">カテゴリ</th>
                    <th className="text-right px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">販売価格</th>
                    <th className="text-right px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">原価/1個</th>
                    <th className="text-right px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">利益率</th>
                    <th className="px-4 py-3 w-28 hidden lg:table-cell" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const ok = row.margin !== null && row.margin >= target;
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{row.name}</td>
                        <td className="px-4 py-3 text-neutral-500 hidden sm:table-cell">{row.category}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                          ¥{row.price.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-neutral-500">
                          {row.costPerUnit !== null ? (
                            `¥${row.costPerUnit.toLocaleString()}`
                          ) : (
                            <span className="text-neutral-300 dark:text-neutral-600">レシピなし</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {row.margin !== null ? (
                            <span className={`font-semibold tabular-nums ${ok ? "text-blue-500" : "text-red-400"}`}>
                              {row.margin.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-neutral-300 dark:text-neutral-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {row.margin !== null && (
                            <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${ok ? "bg-blue-500" : "bg-red-400"}`}
                                style={{ width: `${Math.min(row.margin, 100)}%` }}
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <p className="text-xs text-neutral-400">
            ※ 原価はレシピの材料費合計 ÷ 仕込み量で自動計算されます。レシピ未登録の商品は「—」表示。
          </p>
        </>
      )}
    </div>
  );
}
