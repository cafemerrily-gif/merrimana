"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Calendar, Tag, X } from "lucide-react";
import { Modal, inputCls, FieldLabel } from "@/components/ui/modal";
import { createCampaign, updateCampaign, deleteCampaign } from "@/app/actions/marketing";
import { CAMPAIGN_STATUS_OPTIONS } from "@/types/marketing";
import type { Campaign, CampaignStatus } from "@/types/marketing";
import { cn } from "@/utils/cn";

const statusStyle: Record<CampaignStatus, string> = {
  実施中: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  準備中: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  終了: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
};

type FormState = {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: CampaignStatus;
  tagsInput: string;
};

const emptyForm = (): FormState => ({
  title: "",
  description: "",
  start_date: "",
  end_date: "",
  status: "準備中",
  tagsInput: "",
});

function formatPeriod(start: string | null, end: string | null) {
  if (!start && !end) return null;
  if (start && end) return `${start} 〜 ${end}`;
  if (start) return `${start} 〜`;
  return `〜 ${end}`;
}

export default function CampaignsClient({
  campaigns,
  dbError,
}: {
  campaigns: Campaign[];
  dbError: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "すべて">("すべて");
  const [modal, setModal] = useState<
    null | { mode: "add" } | { mode: "edit"; campaign: Campaign }
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState<string | null>(null);

  const openAdd = () => {
    setForm(emptyForm());
    setError(null);
    setModal({ mode: "add" });
  };

  const openEdit = (c: Campaign) => {
    setForm({
      title: c.title,
      description: c.description,
      start_date: c.start_date ?? "",
      end_date: c.end_date ?? "",
      status: c.status,
      tagsInput: c.tags.join(", "),
    });
    setError(null);
    setModal({ mode: "edit", campaign: c });
  };

  const handleSave = () => {
    setError(null);
    if (!form.title.trim()) return setError("タイトルは必須です");
    if (form.start_date && form.end_date && form.start_date > form.end_date) {
      return setError("終了日は開始日以降を指定してください");
    }

    const tags = form.tagsInput
      .split(/[,、]/)
      .map((t) => t.trim())
      .filter(Boolean);

    const data = {
      title: form.title.trim(),
      description: form.description.trim(),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: form.status,
      tags,
    };

    startTransition(async () => {
      try {
        if (modal?.mode === "edit") {
          await updateCampaign(modal.campaign.id, data);
        } else {
          await createCampaign(data);
        }
        setModal(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "保存に失敗しました");
      }
    });
  };

  const handleDelete = (c: Campaign) => {
    startTransition(async () => {
      try {
        await deleteCampaign(c.id);
        setDeleteTarget(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "削除に失敗しました");
      }
    });
  };

  const filtered =
    statusFilter === "すべて"
      ? campaigns
      : campaigns.filter((c) => c.status === statusFilter);

  const counts = {
    実施中: campaigns.filter((c) => c.status === "実施中").length,
    準備中: campaigns.filter((c) => c.status === "準備中").length,
    終了: campaigns.filter((c) => c.status === "終了").length,
  };

  return (
    <>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              キャンペーン管理
            </h1>
            <p className="text-sm text-neutral-500 mt-0.5">広報・マーケティングユニット</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            新規作成
          </button>
        </div>

        {dbError ? (
          <div className="py-16 text-center text-sm text-neutral-400 rounded-xl border border-neutral-200 dark:border-neutral-800">
            データを取得できませんでした。Supabaseの接続設定を確認してください。
          </div>
        ) : (
          <>
            {/* サマリー */}
            <div className="grid grid-cols-3 gap-3">
              {(["実施中", "準備中", "終了"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(statusFilter === s ? "すべて" : s)}
                  className={cn(
                    "rounded-xl border p-4 text-center transition-colors",
                    statusFilter === s
                      ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700"
                      : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700"
                  )}
                >
                  <p
                    className={`text-2xl font-bold ${
                      s === "実施中"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    {counts[s]}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">{s}</p>
                </button>
              ))}
            </div>

            {/* フィルタ */}
            {statusFilter !== "すべて" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500">フィルタ中：{statusFilter}</span>
                <button
                  onClick={() => setStatusFilter("すべて")}
                  className="text-xs text-neutral-400 hover:text-neutral-600 flex items-center gap-0.5"
                >
                  <X size={12} />
                  解除
                </button>
              </div>
            )}

            {/* キャンペーン一覧 */}
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-neutral-400 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700">
                {campaigns.length === 0
                  ? "キャンペーンがまだ登録されていません。「新規作成」から追加してください。"
                  : "この条件に一致するキャンペーンはありません。"}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((c) => {
                  const period = formatPeriod(c.start_date, c.end_date);
                  return (
                    <div
                      key={c.id}
                      className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
                          {c.title}
                        </h3>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded-full",
                              statusStyle[c.status]
                            )}
                          >
                            {c.status}
                          </span>
                          <button
                            onClick={() => openEdit(c)}
                            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c)}
                            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {c.description && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3 leading-relaxed">
                          {c.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 flex-wrap">
                        {period && (
                          <div className="flex items-center gap-1 text-xs text-neutral-400">
                            <Calendar size={12} />
                            {period}
                          </div>
                        )}
                        {c.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {c.tags.map((tag) => (
                              <span
                                key={tag}
                                className="flex items-center gap-0.5 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full"
                              >
                                <Tag size={10} />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* 追加・編集モーダル */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "キャンペーンを編集" : "キャンペーンを作成"}
      >
        <div className="space-y-4">
          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <FieldLabel label="タイトル *">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="例: 春のモーニングフェア"
              className={inputCls()}
            />
          </FieldLabel>
          <FieldLabel label="説明">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="キャンペーンの詳細を入力..."
              rows={3}
              className={inputCls("resize-none")}
            />
          </FieldLabel>
          <div className="grid grid-cols-2 gap-3">
            <FieldLabel label="開始日">
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className={inputCls()}
              />
            </FieldLabel>
            <FieldLabel label="終了日">
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className={inputCls()}
              />
            </FieldLabel>
          </div>
          <FieldLabel label="ステータス">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as CampaignStatus })}
              className={inputCls()}
            >
              {CAMPAIGN_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </FieldLabel>
          <FieldLabel label="タグ（カンマ区切り）">
            <input
              type="text"
              value={form.tagsInput}
              onChange={(e) => setForm({ ...form, tagsInput: e.target.value })}
              placeholder="例: 割引, モーニング, 季節限定"
              className={inputCls()}
            />
          </FieldLabel>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setModal(null)}
              className="px-4 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {isPending ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </Modal>

      {/* 削除確認 */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="キャンペーンの削除"
      >
        <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-5">
          「<span className="font-semibold">{deleteTarget?.title}</span>
          」を削除しますか？この操作は取り消せません。
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setDeleteTarget(null)}
            className="px-4 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={() => deleteTarget && handleDelete(deleteTarget)}
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
