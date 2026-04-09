"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Calendar, Wallet } from "lucide-react";
import { Modal, inputCls, FieldLabel } from "@/components/ui/modal";
import { createAd, updateAd, deleteAd } from "@/app/actions/marketing";
import { AD_CHANNELS, AD_STATUS_OPTIONS } from "@/types/marketing";
import type { Ad, AdStatus, Campaign } from "@/types/marketing";
import { cn } from "@/utils/cn";

const statusStyle: Record<AdStatus, string> = {
  実施中: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  準備中: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  終了: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  一時停止: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

type FormState = {
  title: string;
  channel: string;
  description: string;
  start_date: string;
  end_date: string;
  cost: string;
  status: AdStatus;
  campaign_id: string;
};

const emptyForm = (): FormState => ({
  title: "",
  channel: AD_CHANNELS[0],
  description: "",
  start_date: "",
  end_date: "",
  cost: "",
  status: "準備中",
  campaign_id: "",
});

export default function AdsClient({
  ads,
  campaigns,
  dbError,
}: {
  ads: Ad[];
  campaigns: Pick<Campaign, "id" | "title">[];
  dbError: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<null | { mode: "add" } | { mode: "edit"; ad: Ad }>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ad | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState("すべて");

  const openAdd = () => {
    setForm(emptyForm());
    setError(null);
    setModal({ mode: "add" });
  };

  const openEdit = (a: Ad) => {
    setForm({
      title: a.title,
      channel: a.channel,
      description: a.description,
      start_date: a.start_date ?? "",
      end_date: a.end_date ?? "",
      cost: String(a.cost),
      status: a.status,
      campaign_id: a.campaign_id ?? "",
    });
    setError(null);
    setModal({ mode: "edit", ad: a });
  };

  const handleSave = () => {
    setError(null);
    if (!form.title.trim()) return setError("広告名は必須です");
    const cost = parseInt(form.cost) || 0;

    const data = {
      title: form.title.trim(),
      channel: form.channel,
      description: form.description.trim(),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      cost,
      status: form.status,
      campaign_id: form.campaign_id || null,
    };

    startTransition(async () => {
      try {
        if (modal?.mode === "edit") {
          await updateAd(modal.ad.id, data);
        } else {
          await createAd(data);
        }
        setModal(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "保存に失敗しました");
      }
    });
  };

  const handleDelete = (a: Ad) => {
    startTransition(async () => {
      try {
        await deleteAd(a.id);
        setDeleteTarget(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "削除に失敗しました");
      }
    });
  };

  const channels = ["すべて", ...Array.from(new Set(ads.map((a) => a.channel)))];
  const filtered =
    channelFilter === "すべて" ? ads : ads.filter((a) => a.channel === channelFilter);

  // チャネル別集計
  const channelSummary = Array.from(
    ads.reduce((map, a) => {
      const prev = map.get(a.channel) ?? { count: 0, cost: 0 };
      map.set(a.channel, { count: prev.count + 1, cost: prev.cost + a.cost });
      return map;
    }, new Map<string, { count: number; cost: number }>())
  ).sort((a, b) => b[1].cost - a[1].cost);

  const totalCost = ads.reduce((s, a) => s + a.cost, 0);
  const activeCost = ads.filter((a) => a.status === "実施中").reduce((s, a) => s + a.cost, 0);

  return (
    <>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">広告管理</h1>
            <p className="text-sm text-neutral-500 mt-0.5">広報・マーケティングユニット</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            広告を登録
          </button>
        </div>

        {dbError ? (
          <div className="py-16 text-center text-sm text-neutral-400 rounded-xl border border-neutral-200 dark:border-neutral-800">
            データを取得できませんでした。Supabaseの接続設定を確認してください。
          </div>
        ) : (
          <>
            {/* サマリー */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
                <p className="text-xs text-neutral-400 mb-1">総広告件数</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{ads.length}件</p>
              </div>
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
                <p className="text-xs text-neutral-400 mb-1">実施中</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {ads.filter((a) => a.status === "実施中").length}件
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
                <p className="text-xs text-neutral-400 mb-1">実施中の広告費</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                  ¥{activeCost.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
                <p className="text-xs text-neutral-400 mb-1">累計広告費</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                  ¥{totalCost.toLocaleString()}
                </p>
              </div>
            </div>

            {/* チャネル別 */}
            {channelSummary.length > 0 && (
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
                <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
                  チャネル別広告費
                </h2>
                <div className="space-y-2.5">
                  {channelSummary.map(([channel, { count, cost }]) => {
                    const pct = totalCost > 0 ? (cost / totalCost) * 100 : 0;
                    return (
                      <div key={channel}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-neutral-700 dark:text-neutral-300">
                            {channel}
                            <span className="text-neutral-400 text-xs ml-1.5">{count}件</span>
                          </span>
                          <span className="text-neutral-500 tabular-nums">
                            ¥{cost.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* チャネルフィルタ */}
            <div className="flex gap-1.5 flex-wrap">
              {channels.map((ch) => (
                <button
                  key={ch}
                  onClick={() => setChannelFilter(ch)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                    channelFilter === ch
                      ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-transparent"
                      : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  )}
                >
                  {ch}
                </button>
              ))}
            </div>

            {/* 広告一覧テーブル */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
              {filtered.length === 0 ? (
                <div className="py-16 text-center text-sm text-neutral-400">
                  {ads.length === 0
                    ? "広告がまだ登録されていません。「広告を登録」から追加してください。"
                    : "この条件に一致する広告はありません。"}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                      <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">広告名</th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 hidden sm:table-cell">チャネル</th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 hidden md:table-cell">期間</th>
                      <th className="text-right px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">費用</th>
                      <th className="text-center px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">状態</th>
                      <th className="px-4 py-3 w-20" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a) => (
                      <tr
                        key={a.id}
                        className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-neutral-900 dark:text-neutral-100">{a.title}</p>
                          {a.campaign && (
                            <p className="text-xs text-neutral-400 mt-0.5">{a.campaign.title}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-neutral-500 hidden sm:table-cell">{a.channel}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {(a.start_date || a.end_date) ? (
                            <div className="flex items-center gap-1 text-xs text-neutral-400">
                              <Calendar size={11} />
                              {a.start_date ?? "—"} 〜 {a.end_date ?? "—"}
                            </div>
                          ) : (
                            <span className="text-xs text-neutral-300 dark:text-neutral-600">期間なし</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-neutral-700 dark:text-neutral-300">
                          {a.cost > 0 ? (
                            <span className="flex items-center justify-end gap-1">
                              <Wallet size={11} className="text-neutral-400" />
                              ¥{a.cost.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-neutral-300 dark:text-neutral-600 text-xs">無償</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", statusStyle[a.status])}>
                            {a.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(a)}
                              className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(a)}
                              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {/* 追加・編集モーダル */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "広告を編集" : "広告を登録"}
      >
        <div className="space-y-4">
          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <FieldLabel label="広告名 *">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="例: 春フェア Instagram投稿"
              className={inputCls()}
            />
          </FieldLabel>
          <div className="grid grid-cols-2 gap-3">
            <FieldLabel label="チャネル *">
              <select
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
                className={inputCls()}
              >
                {AD_CHANNELS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </FieldLabel>
            <FieldLabel label="ステータス">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as AdStatus })}
                className={inputCls()}
              >
                {AD_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </FieldLabel>
          </div>
          <FieldLabel label="説明">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="広告内容のメモ"
              rows={2}
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
          <FieldLabel label="費用（円）">
            <input
              type="number"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
              min="0"
              placeholder="0（無償の場合は0）"
              className={inputCls()}
            />
          </FieldLabel>
          {campaigns.length > 0 && (
            <FieldLabel label="関連キャンペーン">
              <select
                value={form.campaign_id}
                onChange={(e) => setForm({ ...form, campaign_id: e.target.value })}
                className={inputCls()}
              >
                <option value="">キャンペーンなし</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </FieldLabel>
          )}
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
      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="広告の削除">
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
