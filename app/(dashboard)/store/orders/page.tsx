"use client";

import { useState } from "react";
import { Plus, CheckCircle2, Clock, XCircle } from "lucide-react";

type Order = {
  id: number;
  item: string;
  category: string;
  quantity: string;
  vendor: string;
  requestedBy: string;
  requestedAt: string;
  status: "承認待ち" | "承認済" | "却下";
  note: string;
};

const INITIAL_ORDERS: Order[] = [
  { id: 1, item: "コーヒー豆（ブラジル）", category: "コーヒー", quantity: "20kg", vendor: "丸山珈琲", requestedBy: "渡辺 大輔", requestedAt: "2026/04/09 10:30", status: "承認待ち", note: "在庫が3kgを下回ったため" },
  { id: 2, item: "テイクアウトカップ（L）", category: "資材", quantity: "300個", vendor: "アスクル", requestedBy: "伊藤 花", requestedAt: "2026/04/09 09:15", status: "承認済", note: "在庫100個を切ったため" },
  { id: 3, item: "生クリーム", category: "乳製品", quantity: "10L", vendor: "明治フードマテリア", requestedBy: "渡辺 大輔", requestedAt: "2026/04/08 16:40", status: "承認済", note: "" },
  { id: 4, item: "抹茶パウダー", category: "パウダー", quantity: "2kg", vendor: "辻利", requestedBy: "小林 翔", requestedAt: "2026/04/07 11:00", status: "却下", note: "別ルートで調達済み" },
];

const statusIcon = {
  承認待ち: Clock,
  承認済: CheckCircle2,
  却下: XCircle,
};

const statusStyle: Record<Order["status"], string> = {
  承認待ち: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  承認済: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  却下: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState(INITIAL_ORDERS);

  const approve = (id: number) =>
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "承認済" } : o)));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">発注管理</h1>
          <p className="text-sm text-neutral-500 mt-0.5">店舗スタッフユニット</p>
        </div>
        <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={15} />
          発注を申請
        </button>
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-3 gap-3">
        {(["承認待ち", "承認済", "却下"] as Order["status"][]).map((status) => {
          const Icon = statusIcon[status];
          const count = orders.filter((o) => o.status === status).length;
          return (
            <div key={status} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 text-center">
              <Icon size={20} className={`mx-auto mb-1 ${status === "承認待ち" ? "text-yellow-500" : status === "承認済" ? "text-blue-500" : "text-red-400"}`} />
              <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{count}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{status}</p>
            </div>
          );
        })}
      </div>

      {/* 発注一覧 */}
      <div className="space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{order.item}</p>
                <p className="text-xs text-neutral-400">{order.category} · {order.quantity} · {order.vendor}</p>
              </div>
              <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle[order.status]}`}>
                {order.status}
              </span>
            </div>
            {order.note && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">備考: {order.note}</p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-neutral-400">
                {order.requestedBy} · {order.requestedAt}
              </p>
              {order.status === "承認待ち" && (
                <button
                  onClick={() => approve(order.id)}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  承認する
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
