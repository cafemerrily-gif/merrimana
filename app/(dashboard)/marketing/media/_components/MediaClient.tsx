"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, Image as ImageIcon, FileText, Film, Trash2, Pencil, X, File } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { insertMediaAsset, updateMediaAsset, deleteMediaAsset } from "@/app/actions/marketing";
import { Modal, inputCls, FieldLabel } from "@/components/ui/modal";
import type { MediaAsset, MediaFileType } from "@/types/marketing";
import { cn } from "@/utils/cn";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0B";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function getFileType(mimeType: string): MediaFileType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  return "other";
}

const typeConfig: Record<MediaFileType, { icon: React.ElementType; bg: string; color: string; label: string }> = {
  image: { icon: ImageIcon, bg: "bg-blue-100 dark:bg-blue-900/30", color: "text-blue-500", label: "画像" },
  video: { icon: Film, bg: "bg-purple-100 dark:bg-purple-900/30", color: "text-purple-500", label: "動画" },
  pdf: { icon: FileText, bg: "bg-orange-100 dark:bg-orange-900/30", color: "text-orange-500", label: "PDF" },
  other: { icon: File, bg: "bg-neutral-100 dark:bg-neutral-800", color: "text-neutral-500", label: "その他" },
};

export default function MediaClient({
  assets,
  bucketUrl,
  dbError,
}: {
  assets: MediaAsset[];
  bucketUrl: string;
  dbError: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [typeFilter, setTypeFilter] = useState<MediaFileType | "すべて">("すべて");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editTarget, setEditTarget] = useState<MediaAsset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);
  const [editForm, setEditForm] = useState({ name: "", tagsInput: "" });
  const [actionError, setActionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList) => {
      if (files.length === 0) return;
      setUploading(true);
      setUploadError(null);

      const supabase = createClient();
      const errors: string[] = [];

      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() ?? "";
        const safeName = file.name.replace(/\s+/g, "_");
        const path = `${Date.now()}-${safeName}`;

        const { error: uploadErr } = await supabase.storage
          .from("marketing")
          .upload(path, file, { contentType: file.type });

        if (uploadErr) {
          const msg = uploadErr.message.toLowerCase().includes("bucket")
            ? `${file.name}: Storageバケット "marketing" が見つかりません。Supabaseダッシュボードで公開バケットを作成してください。`
            : `${file.name}: ${uploadErr.message}`;
          errors.push(msg);
          continue;
        }

        const insertResult = await insertMediaAsset({
          name: file.name,
          file_path: path,
          file_type: getFileType(file.type),
          file_size: file.size,
          mime_type: file.type,
          tags: [],
        }) as { error?: string };
        if (insertResult.error) {
          errors.push(`${file.name}: メタデータ保存失敗`);
          // ストレージから削除
          await supabase.storage.from("marketing").remove([path]);
        }
      }

      setUploading(false);
      if (errors.length > 0) {
        setUploadError(errors.join("\n"));
      }
      router.refresh();
    },
    [router]
  );

  const openEdit = (a: MediaAsset) => {
    setEditForm({ name: a.name, tagsInput: a.tags.join(", ") });
    setActionError(null);
    setEditTarget(a);
  };

  const handleEditSave = () => {
    if (!editTarget) return;
    setActionError(null);
    const tags = editForm.tagsInput.split(/[,、]/).map((t) => t.trim()).filter(Boolean);
    startTransition(async () => {
      const result = await updateMediaAsset(editTarget.id, {
        name: editForm.name.trim() || editTarget.name,
        tags,
        campaign_id: editTarget.campaign_id,
      }) as { error?: string };
      if (result.error) { setActionError(result.error); return; }
      setEditTarget(null);
      router.refresh();
    });
  };

  const handleDelete = (a: MediaAsset) => {
    startTransition(async () => {
      const result = await deleteMediaAsset(a.id, a.file_path) as { error?: string };
      if (result.error) { setActionError(result.error); return; }
      setDeleteTarget(null);
      router.refresh();
    });
  };

  const filtered =
    typeFilter === "すべて" ? assets : assets.filter((a) => a.file_type === typeFilter);

  const counts = {
    image: assets.filter((a) => a.file_type === "image").length,
    video: assets.filter((a) => a.file_type === "video").length,
    pdf: assets.filter((a) => a.file_type === "pdf").length,
  };

  return (
    <>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">メディア素材</h1>
            <p className="text-sm text-neutral-500 mt-0.5">広報・マーケティングユニット</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !bucketUrl}
            title={!bucketUrl ? 'Supabase Storage の "marketing" バケットを作成してください' : undefined}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Upload size={15} />
            {uploading ? "アップロード中..." : "アップロード"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        {dbError ? (
          <div className="py-16 text-center text-sm text-neutral-400 rounded-xl border border-neutral-200 dark:border-neutral-800">
            データを取得できませんでした。Supabaseの接続設定を確認してください。
          </div>
        ) : (
          <>
            {uploadError && (
              <div className="flex items-start gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
                <p className="flex-1 whitespace-pre-line">{uploadError}</p>
                <button onClick={() => setUploadError(null)}>
                  <X size={13} />
                </button>
              </div>
            )}

            {/* ドラッグ&ドロップエリア */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
              }}
              className={cn(
                "border-2 border-dashed rounded-xl py-8 text-center transition-colors",
                isDragging
                  ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
              )}
            >
              <Upload size={24} className="mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
              <p className="text-sm text-neutral-400">
                ここにファイルをドラッグ&ドロップ
              </p>
              <p className="text-xs text-neutral-300 dark:text-neutral-600 mt-1">
                対応形式: 画像（JPEG/PNG/WebP）・動画（MP4/MOV）・PDF
              </p>
              {!bucketUrl && (
                <p className="text-xs text-red-500 font-medium mt-2">
                  ⚠ Supabase Storage に "marketing" バケットが見つかりません。
                  ダッシュボードの Storage から公開バケット「marketing」を作成してください。
                </p>
              )}
            </div>

            {/* フィルタ */}
            <div className="flex items-center gap-2 flex-wrap">
              {(["すべて", "image", "video", "pdf"] as const).map((f) => {
                const label = f === "すべて" ? `すべて（${assets.length}）`
                  : f === "image" ? `画像（${counts.image}）`
                  : f === "video" ? `動画（${counts.video}）`
                  : `PDF（${counts.pdf}）`;
                return (
                  <button
                    key={f}
                    onClick={() => setTypeFilter(f)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                      typeFilter === f
                        ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-transparent"
                        : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* グリッド */}
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-neutral-400 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700">
                {assets.length === 0
                  ? "素材がまだアップロードされていません。ファイルをドラッグ&ドロップするかボタンからアップロードしてください。"
                  : "この条件に一致するファイルはありません。"}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filtered.map((asset) => {
                  const cfg = typeConfig[asset.file_type];
                  const Icon = cfg.icon;
                  const publicUrl = bucketUrl ? `${bucketUrl}/${asset.file_path}` : null;

                  return (
                    <div
                      key={asset.id}
                      className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden group"
                    >
                      {/* プレビュー */}
                      <div className={cn("h-28 flex items-center justify-center relative overflow-hidden", cfg.bg)}>
                        {asset.file_type === "image" && publicUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={publicUrl}
                            alt={asset.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <Icon size={36} className={cfg.color} />
                        )}
                        {/* オーバーレイ */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => openEdit(asset)}
                            className="p-1.5 bg-white rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(asset)}
                            className="p-1.5 bg-white rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="p-2.5">
                        <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate" title={asset.name}>
                          {asset.name}
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {formatBytes(asset.file_size)} · {asset.created_at.slice(0, 10)}
                        </p>
                        {asset.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {asset.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {asset.tags.length > 2 && (
                              <span className="text-xs text-neutral-400">+{asset.tags.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-neutral-400">{filtered.length}件 / 合計 {assets.length}件</p>
          </>
        )}
      </div>

      {/* 編集モーダル */}
      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="素材を編集">
        <div className="space-y-4">
          {actionError && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
              {actionError}
            </p>
          )}
          <FieldLabel label="ファイル名">
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className={inputCls()}
            />
          </FieldLabel>
          <FieldLabel label="タグ（カンマ区切り）">
            <input
              type="text"
              value={editForm.tagsInput}
              onChange={(e) => setEditForm({ ...editForm, tagsInput: e.target.value })}
              placeholder="例: Instagram, 春フェア, 商品写真"
              className={inputCls()}
            />
          </FieldLabel>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setEditTarget(null)}
              className="px-4 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleEditSave}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {isPending ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </Modal>

      {/* 削除確認 */}
      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="素材の削除">
        <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-5">
          「<span className="font-semibold">{deleteTarget?.name}</span>
          」を削除しますか？Storageからも完全に削除されます。
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
