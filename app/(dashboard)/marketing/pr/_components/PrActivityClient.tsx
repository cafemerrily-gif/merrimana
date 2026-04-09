"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, CalendarDays, Tag } from "lucide-react";
import {
  createPrActivity,
  updatePrActivity,
  deletePrActivity,
} from "@/app/actions/marketing";
import { Modal, inputCls, FieldLabel } from "@/components/ui/modal";
import type { PrActivity, PrActivityStatus } from "@/types/marketing";
import {
  PR_CHANNELS,
  PR_ACTIVITY_STATUS_OPTIONS,
} from "@/types/marketing";
import { cn } from "@/utils/cn";

const statusColors: Record<PrActivityStatus, string> = {
  予定: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  完了: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
  見送り: "bg-neutral-100 dark:bg-neutral-800 text-neutral-500",
};

type FormState = {
  title: string;
  channel: string;
  description: string;
  scheduled_at: string;
  status: PrActivityStatus;
  campaign_id: string;
};

const defaultForm = (): FormState => ({
  title: "",
  channel: PR_CHANNELS[0],
  description: "",
  scheduled_at: "",
  status: "予定",
  campaign_id: "",
});

export default function PrActivityClient({
  activities,
  campaigns,
  dbError,
}: {
  activities: PrActivity[];
  campaigns: { id: string; title: string }[];
  dbError: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<PrActivityStatus | "すべて">("すべて");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PrActivity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PrActivity | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [actionError, setActionError] = useState<string | null>(null);

  const openCreate = () => {
    setForm(defaultForm());
    setActionError(null);
    setEditTarget(null);
    setIsModalOpen(true);
  };

  const openEdit = (a: PrActivity) => {
    setForm({
      title: a.title,
      channel: a.channel,
      description: a.description,
      scheduled_at: a.scheduled_at ?? "",
      status: a.status,
      campaign_id: a.campaign_id ?? "",
    });
    setActionError(null);
    setEditTarget(a);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      setActionError("タイトルを入力してください。");
      return;
    }
    setActionError(null);
    const payload = {
      title: form.title.trim(),
      channel: form.channel,
      description: form.description.trim(),
      scheduled_at: form.scheduled_at || null,
      status: form.status,
      campaign_id: form.campaign_id || null,
    };
    startTransition(async () => {
      try {
        if (editTarget) {
          await updatePrActivity(editTarget.id, payload);
        } else {
          await createPrActivity(payload);
        }
        setIsModalOpen(false);
        router.refresh();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "保存に失敗しました");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deletePrActivity(deleteTarget.id);
        setDeleteTarget(null);
        router.refresh();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "削除に失敗しました");
      }
    });
  };

  const filtered =
    statusFilter === "すべて"
      ? activities
      : activities.filter((a) => a.status === statusFilter);

  const counts = {
    予定: activities.filter((a) => a.status === "予定").length,
    完了: activities.filter((a) => a.status === "完了").length,
    見送り: activities.filter((a) => a.status === "見送り").length,
  };

  return (
    <>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">PR活動</h1>
            <p className="text-sm text-neutral-500 mt-0.5">広報・マーケティングユニット</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            PR活動を追加
          </button>
        </div>

        {dbError ? (
          <div className="py-16 text-center text-sm text-neutral-400 rounded-xl border border-neutral-200 dark:border-neutral-800">
            データを取得できませんでした。Supabaseの接続設定を確認してください。
          </div>
        ) : (
          <>
            {/* ステータスフィルタ */}
            <div className="flex gap-2 flex-wrap">
              {(["すべて", "予定", "完了", "見送り"] as const).map((s) => {
                const count =
                  s === "すべて"
                    ? activities.length
                    : counts[s as PrActivityStatus];
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                      statusFilter === s
                        ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-transparent"
                        : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    )}
                  >
                    {s}（{count}）
                  </button>
                );
              })}
            </div>

            {/* 一覧 */}
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-neutral-400 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700">
                {activities.length === 0
                  ? "PR活動を追加してください。Instagram投稿、チラシ配布、口コミ活動などを記録できます。"
                  : "この条件に一致するPR活動はありません。"}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full",
                            statusColors[a.status]
                          )}
                        >
                          {a.status}
                        </span>
                        <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded-full">
                          {a.channel}
                        </span>
                        {a.campaign && (
                          <span className="text-xs text-blue-500 flex items-center gap-1">
                            <Tag size={10} />
                            {a.campaign.title}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                        {a.title}
                      </p>
                      {a.description && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                          {a.description}
                        </p>
                      )}
                      {a.scheduled_at && (
                        <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                          <CalendarDays size={11} />
                          {a.scheduled_at}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(a)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(a)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-neutral-400">{filtered.length}件 / 合計 {activities.length}件</p>
          </>
        )}
      </div>

      {/* 追加・編集モーダル */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editTarget ? "PR活動を編集" : "PR活動を追加"}
      >
        <div className="space-y-4">
          {actionError && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
              {actionError}
            </p>
          )}
          <FieldLabel label="タイトル *">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="例: 春フェアInstagram投稿"
              className={inputCls()}
            />
          </FieldLabel>
          <div className="grid grid-cols-2 gap-3">
            <FieldLabel label="チャネル">
              <select
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
                className={inputCls()}
              >
                {PR_CHANNELS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </FieldLabel>
            <FieldLabel label="ステータス">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as PrActivityStatus })}
                className={inputCls()}
              >
                {PR_ACTIVITY_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </FieldLabel>
          </div>
          <FieldLabel label="実施予定日">
            <input
              type="date"
              value={form.scheduled_at}
              onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
              className={inputCls()}
            />
          </FieldLabel>
          <FieldLabel label="関連キャンペーン">
            <select
              value={form.campaign_id}
              onChange={(e) => setForm({ ...form, campaign_id: e.target.value })}
              className={inputCls()}
            >
              <option value="">なし</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </FieldLabel>
          <FieldLabel label="詳細メモ">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="内容・目的・参考リンクなど"
              rows={3}
              className={inputCls()}
            />
          </FieldLabel>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {isPending ? "保存中..." : editTarget ? "更新" : "追加"}
            </button>
          </div>
        </div>
      </Modal>

      {/* 削除確認 */}
      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="PR活動の削除">
        <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-5">
          「<span className="font-semibold">{deleteTarget?.title}</span>」を削除しますか？
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setDeleteTarget(null)}
            className="px-4 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {isPending ? "削除中..." : "削除する"}
          </button>
        </div>
      </Modal>
    </>
  );
}
