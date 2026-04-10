"use client";

import { useState, useTransition } from "react";
import { Save, Check } from "lucide-react";
import { saveSettings } from "@/app/actions/system";
import { inputCls } from "@/components/ui/modal";
import type { SettingsMap } from "../page";

export default function MasterClient({
  settings: initial,
  dbError,
}: {
  settings: SettingsMap;
  dbError: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [s, setS] = useState<SettingsMap>(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: string, value: string) => setS((prev) => ({ ...prev, [key]: value }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveSettings(Object.entries(s).map(([key, value]) => ({ key, value })));
      if (result.error) { setError(result.error); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  if (dbError) {
    return (
      <div className="py-16 text-center text-sm text-neutral-400 rounded-xl border border-neutral-200 dark:border-neutral-800 max-w-2xl">
        データを取得できませんでした。schema_system.sql を実行してください。
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">マスタ設定</h1>
        <p className="text-sm text-neutral-500 mt-0.5">システムユニット</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {error && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* 店舗基本情報 */}
        <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">店舗基本情報</h2>
          </div>
          <div className="p-4 space-y-4">
            {([
              { key: "store_name",    label: "店舗名",       type: "text",  placeholder: "Merrimana Café" },
              { key: "store_address", label: "住所",         type: "text",  placeholder: "東京都〇〇区..." },
              { key: "store_phone",   label: "電話番号",     type: "tel",   placeholder: "03-XXXX-XXXX" },
              { key: "store_email",   label: "メールアドレス", type: "email", placeholder: "info@example.com" },
            ] as const).map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">{label}</label>
                <input
                  type={type}
                  value={s[key] ?? ""}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={placeholder}
                  className={inputCls()}
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
            {([
              { label: "月〜金", openKey: "hours_weekday_open",  closeKey: "hours_weekday_close" },
              { label: "土曜日", openKey: "hours_saturday_open", closeKey: "hours_saturday_close" },
              { label: "日・祝", openKey: "hours_holiday_open",  closeKey: "hours_holiday_close" },
            ] as const).map(({ label, openKey, closeKey }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-sm text-neutral-600 dark:text-neutral-400 w-16 shrink-0">{label}</span>
                <input
                  type="time"
                  value={s[openKey] ?? ""}
                  onChange={(e) => set(openKey, e.target.value)}
                  className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <span className="text-neutral-400 text-sm">〜</span>
                <input
                  type="time"
                  value={s[closeKey] ?? ""}
                  onChange={(e) => set(closeKey, e.target.value)}
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
            {([
              { key: "notify_daily_report",    label: "日報提出時に通知" },
              { key: "notify_order",           label: "発注申請時に通知" },
              { key: "notify_monthly_report",  label: "月次レポート自動送信" },
              { key: "notify_inventory_alert", label: "在庫不足アラート" },
            ] as const).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={s[key] === "true"}
                  onChange={(e) => set(key, e.target.checked ? "true" : "false")}
                  className="w-4 h-4 rounded accent-blue-600"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <Check size={14} />
              保存しました
            </span>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            <Save size={15} />
            {isPending ? "保存中..." : "変更を保存"}
          </button>
        </div>
      </form>
    </div>
  );
}
