"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isEnvError = error.message?.includes("環境変数") || error.message?.includes("SERVICE_ROLE");

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-md w-full space-y-4 text-center">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          エラーが発生しました
        </h2>
        {isEnvError ? (
          <div className="text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 text-left space-y-2">
            <p className="font-medium text-red-600 dark:text-red-400">環境変数が未設定です</p>
            <p>Vercel の <strong>Settings → Environment Variables</strong> に以下を追加してください：</p>
            <code className="block bg-neutral-100 dark:bg-neutral-800 rounded px-2 py-1 text-xs">
              SUPABASE_SERVICE_ROLE_KEY
            </code>
            <p className="text-xs text-neutral-400">追加後に Redeploy が必要です。</p>
          </div>
        ) : (
          <p className="text-sm text-neutral-500">{error.message}</p>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
        >
          再試行
        </button>
      </div>
    </div>
  );
}
