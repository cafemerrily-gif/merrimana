"use client";

import { useState, useTransition } from "react";
import { Save, Check } from "lucide-react";
import { savePermissions } from "@/app/actions/permissions";
import { PERMISSION_DEFS } from "@/utils/permission-defs";

const UNITS = ["会計・経営戦略", "商品開発", "広報・マーケティング", "システム", "店舗スタッフ"];

export default function RolesClient({
  initial,
  dbError,
}: {
  initial: Record<string, string[]>;
  dbError: boolean;
}) {
  // matrix[unit] = Set of allowed permission IDs
  const [matrix, setMatrix] = useState<Record<string, Set<string>>>(() =>
    Object.fromEntries(UNITS.map((u) => [u, new Set(initial[u] ?? [])]))
  );
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (unit: string, permId: string) => {
    setMatrix((prev) => {
      const next = new Set(prev[unit]);
      next.has(permId) ? next.delete(permId) : next.add(permId);
      return { ...prev, [unit]: next };
    });
    setSaved(false);
  };

  const handleSave = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        const serialized = Object.fromEntries(
          UNITS.map((u) => [u, Array.from(matrix[u])])
        );
        await savePermissions(serialized);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "保存に失敗しました");
      }
    });
  };

  if (dbError) {
    return (
      <div className="py-16 text-center text-sm text-neutral-400 rounded-xl border border-neutral-200 dark:border-neutral-800 max-w-5xl">
        データを取得できませんでした。schema_permissions.sql を実行してください。
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">ロール・権限</h1>
          <p className="text-sm text-neutral-500 mt-0.5">システムユニット</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <Check size={14} />
              保存しました
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            <Save size={15} />
            {isPending ? "保存中..." : "変更を保存"}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            権限マトリクス（ユニット別）
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 min-w-40">
                  権限
                </th>
                {UNITS.map((unit) => (
                  <th key={unit} className="px-3 py-3 font-medium text-neutral-500 dark:text-neutral-400 text-center min-w-28">
                    {unit}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_DEFS.map((perm) => (
                <tr
                  key={perm.id}
                  className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <td className="px-4 py-2.5 text-neutral-700 dark:text-neutral-300">
                    {perm.label}
                  </td>
                  {UNITS.map((unit) => {
                    const allowed = matrix[unit]?.has(perm.id) ?? false;
                    return (
                      <td key={unit} className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggle(unit, perm.id)}
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                            allowed
                              ? "bg-blue-500 hover:bg-blue-600 text-white"
                              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-300 dark:text-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                          }`}
                          aria-label={`${unit} - ${perm.label}`}
                          title={allowed ? "クリックで無効化" : "クリックで有効化"}
                        >
                          {allowed ? "✓" : "—"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 管理者ロールの説明 */}
      <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/20 px-4 py-3 flex gap-3">
        <span className="text-blue-500 text-sm mt-0.5">ℹ</span>
        <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <p className="font-semibold">管理者ロールについて</p>
          <p>役割が「管理者」に設定されているユーザーは、所属ユニットに関係なく<strong>すべての権限</strong>を自動的に持ちます。上のマトリクスの設定対象外です。</p>
          <p>役割はユーザー管理ページの編集ボタンから変更できます。</p>
        </div>
      </div>

      <p className="text-xs text-neutral-400">
        ※ チェックマークをクリックして権限を切り替え、「変更を保存」で確定します。変更はすぐに反映されます。
      </p>
    </div>
  );
}
