"use client";

import { useState, useTransition } from "react";
import { UserPlus, Pencil, Trash2, MailCheck, Clock } from "lucide-react";
import { inviteUser, updateProfile, deleteUser } from "@/app/actions/system";
import { Modal, inputCls, FieldLabel } from "@/components/ui/modal";
import { cn } from "@/utils/cn";
import type { UserRow } from "../page";

const UNITS = ["会計・経営戦略", "商品開発", "広報・マーケティング", "システム", "店舗スタッフ"];
const ROLES = ["管理者", "ユニット長", "メンバー", "スタッフ"];

const unitColors: Record<string, string> = {
  "会計・経営戦略":      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "商品開発":            "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "広報・マーケティング": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  "システム":            "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  "店舗スタッフ":        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

type InviteForm = { email: string; name: string; unit: string; role: string };
type EditForm   = { name: string; unit: string; role: string };

export default function UsersClient({
  users: initialUsers,
  dbError,
}: {
  users: UserRow[];
  dbError: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [inviteModal, setInviteModal] = useState(false);
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [inviteForm, setInviteForm] = useState<InviteForm>({ email: "", name: "", unit: "店舗スタッフ", role: "スタッフ" });
  const [editForm, setEditForm]     = useState<EditForm>({ name: "", unit: "", role: "" });
  const [error, setError] = useState<string | null>(null);

  const openInvite = () => {
    setInviteForm({ email: "", name: "", unit: "店舗スタッフ", role: "スタッフ" });
    setError(null);
    setInviteModal(true);
  };

  const openEdit = (u: UserRow) => {
    setEditForm({ name: u.name, unit: u.unit, role: u.role });
    setError(null);
    setEditTarget(u);
  };

  const handleInvite = () => {
    if (!inviteForm.email.trim()) { setError("メールアドレスを入力してください。"); return; }
    setError(null);
    startTransition(async () => {
      try {
        await inviteUser(inviteForm);
        // 仮ユーザーとしてリストに追加（IDは招待後に確定するためサーバーリロードが必要）
        setInviteModal(false);
        // 招待は非同期でメール送信されるため、ページリロードで反映
        window.location.reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : "招待に失敗しました");
      }
    });
  };

  const handleEditSave = () => {
    if (!editTarget) return;
    if (!editForm.name.trim()) { setError("氏名を入力してください。"); return; }
    setError(null);
    startTransition(async () => {
      try {
        await updateProfile(editTarget.id, editForm);
        setUsers((prev) =>
          prev.map((u) => u.id === editTarget.id ? { ...u, ...editForm } : u)
        );
        setEditTarget(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "更新に失敗しました");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deleteUser(deleteTarget.id);
        setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
        setDeleteTarget(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "削除に失敗しました");
      }
    });
  };

  const active   = users.filter((u) => u.confirmed);
  const pending  = users.filter((u) => !u.confirmed);

  return (
    <>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">ユーザー管理</h1>
            <p className="text-sm text-neutral-500 mt-0.5">システムユニット</p>
          </div>
          <button
            onClick={openInvite}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <UserPlus size={15} />
            ユーザーを招待
          </button>
        </div>

        {dbError ? (
          <div className="py-16 text-center text-sm text-neutral-400 rounded-xl border border-neutral-200 dark:border-neutral-800">
            データを取得できませんでした。SUPABASE_SERVICE_ROLE_KEY の設定を確認してください。
          </div>
        ) : (
          <>
            {/* サマリー */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "総ユーザー数", value: users.length },
                { label: "確認済み",     value: active.length },
                { label: "招待中",       value: pending.length },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 text-center">
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
                  <p className="text-xs text-neutral-400 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* ユーザーテーブル */}
            {users.length === 0 ? (
              <div className="py-16 text-center text-sm text-neutral-400 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700">
                ユーザーがいません。「ユーザーを招待」からメンバーを追加してください。
              </div>
            ) : (
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">氏名 / メール</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 hidden md:table-cell">所属ユニット</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">役割</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 hidden lg:table-cell">最終ログイン</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">状態</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-neutral-900 dark:text-neutral-100">
                            {u.name || <span className="text-neutral-400 italic">未設定</span>}
                          </p>
                          <p className="text-xs text-neutral-400">{u.email}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", unitColors[u.unit] ?? "bg-neutral-100 text-neutral-500")}>
                            {u.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 text-sm">{u.role}</td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-xs text-neutral-400 tabular-nums">{formatDate(u.lastSignIn)}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {u.confirmed ? (
                            <span title="確認済み">
                              <MailCheck size={14} className="inline text-blue-500" />
                            </span>
                          ) : (
                            <span title="招待中" className="flex items-center justify-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                              <Clock size={12} />
                              招待中
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(u)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => { setError(null); setDeleteTarget(u); }}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* 招待モーダル */}
      <Modal open={inviteModal} onClose={() => setInviteModal(false)} title="ユーザーを招待">
        <div className="space-y-4">
          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">{error}</p>
          )}
          <FieldLabel label="メールアドレス *">
            <input
              type="email"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              placeholder="member@example.com"
              className={inputCls()}
            />
          </FieldLabel>
          <FieldLabel label="氏名">
            <input
              type="text"
              value={inviteForm.name}
              onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
              placeholder="田中 由美"
              className={inputCls()}
            />
          </FieldLabel>
          <div className="grid grid-cols-2 gap-3">
            <FieldLabel label="所属ユニット">
              <select value={inviteForm.unit} onChange={(e) => setInviteForm({ ...inviteForm, unit: e.target.value })} className={inputCls()}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </FieldLabel>
            <FieldLabel label="役割">
              <select value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })} className={inputCls()}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </FieldLabel>
          </div>
          <p className="text-xs text-neutral-400">
            入力したメールアドレスに招待リンクが送信されます。
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setInviteModal(false)} className="px-4 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              キャンセル
            </button>
            <button onClick={handleInvite} disabled={isPending} className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors">
              {isPending ? "送信中..." : "招待する"}
            </button>
          </div>
        </div>
      </Modal>

      {/* 編集モーダル */}
      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="ユーザー情報を編集">
        <div className="space-y-4">
          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">{error}</p>
          )}
          <FieldLabel label="氏名 *">
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className={inputCls()}
            />
          </FieldLabel>
          <div className="grid grid-cols-2 gap-3">
            <FieldLabel label="所属ユニット">
              <select value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} className={inputCls()}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </FieldLabel>
            <FieldLabel label="役割">
              <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className={inputCls()}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </FieldLabel>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setEditTarget(null)} className="px-4 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              キャンセル
            </button>
            <button onClick={handleEditSave} disabled={isPending} className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors">
              {isPending ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </Modal>

      {/* 削除確認 */}
      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="ユーザーを削除">
        <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-5">
          <span className="font-semibold">{deleteTarget?.name || deleteTarget?.email}</span> を削除しますか？
          この操作は取り消せません。
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
            キャンセル
          </button>
          <button onClick={handleDelete} disabled={isPending} className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors">
            {isPending ? "削除中..." : "削除する"}
          </button>
        </div>
      </Modal>
    </>
  );
}
