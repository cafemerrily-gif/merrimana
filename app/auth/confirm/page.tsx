import { Suspense } from "react";
import ConfirmInner from "./ConfirmInner";
import { Coffee } from "lucide-react";

export default function ConfirmPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-neutral-900 dark:bg-white flex items-center justify-center mb-4">
            <Coffee size={24} className="text-white dark:text-neutral-900" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Merrimana</h1>
          <p className="text-sm text-neutral-500 mt-1">管理システム</p>
        </div>
        <Suspense fallback={<p className="text-center text-sm text-neutral-500">読み込み中...</p>}>
          <ConfirmInner />
        </Suspense>
        <p className="text-center text-xs text-neutral-400 mt-8">
          © 2025 Merrimana Café. All rights reserved.
        </p>
      </div>
    </div>
  );
}
