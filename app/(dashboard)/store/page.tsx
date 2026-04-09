"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Send } from "lucide-react";

const TODAY_SHIFTS = [
  { name: "伊藤 花", role: "ホール", time: "09:00〜14:00", status: "出勤済" },
  { name: "渡辺 大輔", role: "キッチン", time: "09:00〜15:00", status: "出勤済" },
  { name: "山田 美咲", role: "ホール", time: "13:00〜18:00", status: "未出勤" },
  { name: "小林 翔", role: "キッチン", time: "14:00〜19:00", status: "未出勤" },
];

const CHECKLIST_ITEMS = [
  { id: 1, label: "開店前の清掃（ホール）" },
  { id: 2, label: "コーヒー豆の補充確認" },
  { id: 3, label: "冷蔵庫温度チェック（5℃以下）" },
  { id: 4, label: "POSレジの起動・精算確認" },
  { id: 5, label: "ショーケース商品の陳列" },
  { id: 6, label: "トイレ清掃・備品補充" },
];

export default function StorePage() {
  const [checked, setChecked] = useState<number[]>([1, 2]);
  const [reportText, setReportText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const toggle = (id: number) =>
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reportText.trim()) setSubmitted(true);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">日報</h1>
        <p className="text-sm text-neutral-500 mt-0.5">店舗スタッフユニット</p>
      </div>

      {/* 本日のシフト */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">本日のシフト</h2>
        </div>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {TODAY_SHIFTS.map((s) => (
            <div key={s.name} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{s.name}</p>
                <p className="text-xs text-neutral-400">{s.role} · {s.time}</p>
              </div>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  s.status === "出勤済"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800"
                }`}
              >
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 開店チェックリスト */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">開店チェックリスト</h2>
          <span className="text-xs text-neutral-400">
            {checked.length}/{CHECKLIST_ITEMS.length} 完了
          </span>
        </div>
        {/* プログレスバー */}
        <div className="h-1 bg-neutral-100 dark:bg-neutral-800">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${(checked.length / CHECKLIST_ITEMS.length) * 100}%` }}
          />
        </div>
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {CHECKLIST_ITEMS.map((item) => {
            const done = checked.includes(item.id);
            return (
              <li key={item.id}>
                <button
                  onClick={() => toggle(item.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  {done ? (
                    <CheckCircle2 size={18} className="text-blue-500 shrink-0" />
                  ) : (
                    <Circle size={18} className="text-neutral-300 dark:text-neutral-600 shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      done
                        ? "line-through text-neutral-400"
                        : "text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 日報フォーム */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">本日の報告</h2>
        </div>
        <div className="p-4">
          {submitted ? (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium py-2">
              <CheckCircle2 size={18} />
              日報を提出しました
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="本日の営業状況、特記事項、改善提案などを記入してください..."
                rows={5}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!reportText.trim()}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  <Send size={14} />
                  提出する
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
