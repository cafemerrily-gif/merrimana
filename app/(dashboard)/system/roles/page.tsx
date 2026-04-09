const UNITS = ["会計・経営戦略", "商品開発", "広報・マーケティング", "システム", "店舗スタッフ"];

const PERMISSIONS = [
  { id: "view_dashboard", label: "ダッシュボード閲覧" },
  { id: "view_accounting", label: "会計データ閲覧" },
  { id: "edit_accounting", label: "会計データ編集" },
  { id: "view_products", label: "商品・レシピ閲覧" },
  { id: "edit_products", label: "商品・レシピ編集" },
  { id: "view_marketing", label: "広報データ閲覧" },
  { id: "edit_marketing", label: "広報データ編集" },
  { id: "view_store", label: "店舗データ閲覧" },
  { id: "edit_store", label: "店舗データ編集" },
  { id: "manage_users", label: "ユーザー管理" },
  { id: "manage_master", label: "マスタ設定変更" },
];

// unit x permission matrix: true = allowed
const MATRIX: Record<string, Record<string, boolean>> = {
  "会計・経営戦略": {
    view_dashboard: true, view_accounting: true, edit_accounting: true,
    view_products: true, view_marketing: true, view_store: true,
  },
  "商品開発": {
    view_dashboard: true, view_products: true, edit_products: true, view_accounting: true,
  },
  "広報・マーケティング": {
    view_dashboard: true, view_marketing: true, edit_marketing: true, view_products: true,
  },
  "システム": {
    view_dashboard: true, view_accounting: true, view_products: true,
    view_marketing: true, view_store: true, manage_users: true, manage_master: true,
  },
  "店舗スタッフ": {
    view_dashboard: true, view_store: true, edit_store: true, view_products: true,
  },
};

export default function RolesPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">ロール・権限</h1>
        <p className="text-sm text-neutral-500 mt-0.5">システムユニット</p>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">権限マトリクス（ユニット別）</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 min-w-40">権限</th>
                {UNITS.map((unit) => (
                  <th key={unit} className="px-3 py-3 font-medium text-neutral-500 dark:text-neutral-400 text-center min-w-28">
                    {unit}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((perm) => (
                <tr key={perm.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td className="px-4 py-2.5 text-neutral-700 dark:text-neutral-300">{perm.label}</td>
                  {UNITS.map((unit) => {
                    const allowed = MATRIX[unit]?.[perm.id] ?? false;
                    return (
                      <td key={unit} className="px-3 py-2.5 text-center">
                        {allowed ? (
                          <span className="inline-block w-5 h-5 rounded-full bg-blue-500 text-white text-xs leading-5">✓</span>
                        ) : (
                          <span className="inline-block w-5 h-5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-300 dark:text-neutral-600 text-xs leading-5">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-neutral-400">
        ※ 権限の変更は Supabase RLS ポリシーと連動します。変更後はシステムユニット長の承認が必要です。
      </p>
    </div>
  );
}
