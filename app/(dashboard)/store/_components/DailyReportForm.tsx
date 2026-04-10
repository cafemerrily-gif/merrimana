"use client";

import { useState } from "react";
import { CheckCircle2, Send, Pencil } from "lucide-react";
import { submitDailyReport } from "@/app/actions/store";
import { useRouter } from "next/navigation";

export default function DailyReportForm({
  date,
  existingContent,
  submittedBy,
  currentUserName,
}: {
  date: string;
  existingContent: string | null;
  submittedBy: string | null;
  currentUserName: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(!existingContent);
  const [text, setText] = useState(existingContent ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    setError(null);
    const result = await submitDailyReport({
      date,
      content: text.trim(),
      submitted_by: currentUserName,
    }) as { error?: string };
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditing(false);
    router.refresh();
  };

  if (!editing && existingContent) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium">
            <CheckCircle2 size={16} />
            提出済み
            {submittedBy && (
              <span className="text-xs text-neutral-400 font-normal">（{submittedBy}）</span>
            )}
          </div>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            <Pencil size={12} />
            編集
          </button>
        </div>
        <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap bg-neutral-50 dark:bg-neutral-800 rounded-lg px-4 py-3 leading-relaxed">
          {existingContent}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="本日の営業状況、特記事項、改善提案などを記入してください..."
        rows={5}
        className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
      />
      <div className="flex items-center justify-between">
        {existingContent && (
          <button
            type="button"
            onClick={() => { setEditing(false); setText(existingContent); }}
            className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            キャンセル
          </button>
        )}
        <div className="ml-auto">
          <button
            type="submit"
            disabled={!text.trim() || saving}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Send size={14} />
            {saving ? "提出中..." : "提出する"}
          </button>
        </div>
      </div>
    </form>
  );
}
