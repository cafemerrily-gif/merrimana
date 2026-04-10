import Link from "next/link";
import { ShieldOff } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <ShieldOff size={28} className="text-neutral-400" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
          アクセス権限がありません
        </h1>
        <p className="text-sm text-neutral-500">
          このページを表示する権限がありません。<br />
          権限の変更が必要な場合はシステムユニットにご連絡ください。
        </p>
        <Link
          href="/"
          className="inline-block mt-2 px-5 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
        >
          ホームへ戻る
        </Link>
      </div>
    </div>
  );
}
