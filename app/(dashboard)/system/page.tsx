import { UserPlus, MoreHorizontal } from "lucide-react";

const USERS = [
  { id: 1, name: "田中 由美", email: "tanaka@merrimana.com", unit: "会計・経営戦略", role: "ユニット長", lastLogin: "2026/04/09 09:14", active: true },
  { id: 2, name: "佐藤 健太", email: "sato@merrimana.com", unit: "商品開発", role: "ユニット長", lastLogin: "2026/04/09 08:52", active: true },
  { id: 3, name: "鈴木 彩", email: "suzuki@merrimana.com", unit: "広報・マーケティング", role: "ユニット長", lastLogin: "2026/04/08 17:30", active: true },
  { id: 4, name: "高橋 誠", email: "takahashi@merrimana.com", unit: "システム", role: "管理者", lastLogin: "2026/04/09 10:01", active: true },
  { id: 5, name: "伊藤 花", email: "ito@merrimana.com", unit: "店舗スタッフ", role: "スタッフ", lastLogin: "2026/04/09 07:45", active: true },
  { id: 6, name: "渡辺 大輔", email: "watanabe@merrimana.com", unit: "店舗スタッフ", role: "スタッフ", lastLogin: "2026/04/07 18:20", active: true },
  { id: 7, name: "中村 優", email: "nakamura@merrimana.com", unit: "会計・経営戦略", role: "メンバー", lastLogin: "2026/03/28 11:05", active: false },
];

const unitColors: Record<string, string> = {
  "会計・経営戦略": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "商品開発": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "広報・マーケティング": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  "システム": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  "店舗スタッフ": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export default function SystemPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">ユーザー管理</h1>
          <p className="text-sm text-neutral-500 mt-0.5">システムユニット</p>
        </div>
        <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <UserPlus size={15} />
          ユーザーを招待
        </button>
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "総ユーザー数", value: USERS.length },
          { label: "アクティブ", value: USERS.filter((u) => u.active).length },
          { label: "非アクティブ", value: USERS.filter((u) => !u.active).length },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 text-center"
          >
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
            <p className="text-xs text-neutral-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ユーザーテーブル */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
              <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">氏名</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 hidden md:table-cell">所属ユニット</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">役割</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 hidden lg:table-cell">最終ログイン</th>
              <th className="text-center px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">状態</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {USERS.map((user) => (
              <tr
                key={user.id}
                className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{user.name}</p>
                    <p className="text-xs text-neutral-400">{user.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${unitColors[user.unit] ?? ""}`}>
                    {user.unit}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{user.role}</td>
                <td className="px-4 py-3 text-neutral-400 text-xs tabular-nums hidden lg:table-cell">
                  {user.lastLogin}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      user.active ? "bg-blue-500" : "bg-neutral-300 dark:bg-neutral-600"
                    }`}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                    <MoreHorizontal size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
