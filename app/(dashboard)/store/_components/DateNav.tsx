"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function DateNav({
  dateStr,
  todayStr,
}: {
  dateStr: string;
  todayStr: string;
}) {
  const router = useRouter();

  function navigate(targetDate: string) {
    router.push(`/store?date=${targetDate}`);
  }

  function offset(days: number) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const next = new Date(y, m - 1, d + days);
    const yy = next.getFullYear();
    const mm = String(next.getMonth() + 1).padStart(2, "0");
    const dd = String(next.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  }

  const isToday = dateStr === todayStr;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => navigate(offset(-1))}
        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
        title="前の日"
      >
        <ChevronLeft size={16} />
      </button>
      <input
        type="date"
        value={dateStr}
        max={todayStr}
        onChange={(e) => { if (e.target.value) navigate(e.target.value); }}
        className="text-sm text-neutral-700 dark:text-neutral-300 bg-transparent border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
      />
      <button
        onClick={() => navigate(offset(1))}
        disabled={isToday}
        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="次の日"
      >
        <ChevronRight size={16} />
      </button>
      {!isToday && (
        <button
          onClick={() => navigate(todayStr)}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          今日
        </button>
      )}
    </div>
  );
}
