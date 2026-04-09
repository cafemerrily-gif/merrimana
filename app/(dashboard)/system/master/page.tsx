"use client";

import { useState } from "react";
import { Save } from "lucide-react";

export default function MasterPage() {
  const [saved, setSaved] = useState(false);
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">マスタ設定</h1>
        <p className="text-sm text-neutral-500 mt-0.5">システムユニット</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* 店舗基本情報 */}
        <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">店舗基本情報</h2>
          </div>
          <div className="p-4 space-y-4">
            {[
              { label: "店舗名", defaultValue: "Merrimana Café", type: "text" },
              { label: "住所", defaultValue: "東京都渋谷区〇〇 1-2-3", type: "text" },
              { label: "電話番号", defaultValue: "03-XXXX-XXXX", type: "tel" },
              { label: "メールアドレス", defaultValue: "info@merrimana.com", type: "email" },
            ].map(({ label, defaultValue, type }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">{label}</label>
                <input
                  type={type}
                  defaultValue={defaultValue}
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            ))}
          </div>
        </section>

        {/* 営業時間 */}
        <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">営業時間</h2>
          </div>
          <div className="p-4 space-y-3">
            {[
              { label: "月〜金", open: "08:00", close: "19:00" },
              { label: "土曜日", open: "09:00", close: "20:00" },
              { label: "日曜日・祝日", open: "10:00", close: "18:00" },
            ].map(({ label, open, close }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-sm text-neutral-600 dark:text-neutral-400 w-28 shrink-0">{label}</span>
                <input
                  type="time"
                  defaultValue={open}
                  className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <span className="text-neutral-400 text-sm">〜</span>
                <input
                  type="time"
                  defaultValue={close}
                  className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            ))}
          </div>
        </section>

        {/* 通知設定 */}
        <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">通知設定（Microsoft Teams）</h2>
          </div>
          <div className="p-4 space-y-3">
            {[
              { label: "日報提出時に通知", defaultChecked: true },
              { label: "発注申請時に通知", defaultChecked: true },
              { label: "月次レポート自動送信", defaultChecked: false },
              { label: "在庫不足アラート", defaultChecked: true },
            ].map(({ label, defaultChecked }) => (
              <label key={label} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={defaultChecked}
                  className="w-4 h-4 rounded accent-blue-600"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            <Save size={15} />
            {saved ? "保存しました" : "変更を保存"}
          </button>
        </div>
      </form>
    </div>
  );
}
