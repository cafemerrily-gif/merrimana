"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, LogIn, LogOut, Plus, Edit2, Trash2, X, Check, AlertCircle } from "lucide-react";
import { clockIn, clockOut, upsertTimecard, deleteTimecard } from "@/app/actions/store";
import type { TimecardRow } from "../page";

// ── Helpers ──────────────────────────────────────────────────────────────────

function toJSTTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function toJSTTimeInput(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function jstToISO(date: string, time: string): string {
  if (!time) return "";
  const [h, min] = time.split(":").map(Number);
  const [y, mo, d] = date.split("-").map(Number);
  // JST = UTC+9
  const utcMs = Date.UTC(y, mo - 1, d, h - 9, min);
  return new Date(utcMs).toISOString();
}

function calcWorkMinutes(clockInISO: string | null, clockOutISO: string | null, breakMin: number) {
  if (!clockInISO || !clockOutISO) return 0;
  const diff = (new Date(clockOutISO).getTime() - new Date(clockInISO).getTime()) / 60000;
  return Math.max(0, Math.round(diff - breakMin));
}

function fmtWorkTime(minutes: number): string {
  if (minutes <= 0) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${y}年${m}月`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ModalState =
  | { mode: "add" }
  | { mode: "edit"; row: TimecardRow }
  | null;

// ── Component ─────────────────────────────────────────────────────────────────

export default function TimecardClient({
  timecards,
  currentMonth,
  availableMonths,
  todayStr,
  currentUserName,
}: {
  timecards: TimecardRow[];
  currentMonth: string;
  availableMonths: string[];
  todayStr: string;
  currentUserName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [modal, setModal] = useState<ModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const todayMonth = todayStr.slice(0, 7);
  const isCurrentMonth = currentMonth === todayMonth;
  const todayCard = isCurrentMonth
    ? timecards.find((t) => t.staff_name === currentUserName && t.date === todayStr) ?? null
    : null;

  const staffList = Array.from(new Set(timecards.map((t) => t.staff_name))).sort();
  const filtered = staffFilter === "all" ? timecards : timecards.filter((t) => t.staff_name === staffFilter);

  // Group by date for display
  const grouped: Record<string, TimecardRow[]> = {};
  for (const tc of filtered) {
    if (!grouped[tc.date]) grouped[tc.date] = [];
    grouped[tc.date].push(tc);
  }
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  // Total working hours for current month
  const totalMinutes = filtered.reduce(
    (s, t) => s + calcWorkMinutes(t.clock_in, t.clock_out, t.break_minutes),
    0
  );

  const handleClockIn = async () => {
    if (!currentUserName) return;
    setLoading(true);
    setError(null);
    const result = await clockIn(currentUserName, todayStr) as { error?: string };
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    router.refresh();
  };

  const handleClockOut = async () => {
    if (!todayCard?.id) return;
    setLoading(true);
    setError(null);
    const result = await clockOut(todayCard.id) as { error?: string };
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    const result = await deleteTimecard(deleteTarget) as { error?: string };
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setDeleteTarget(null);
    router.refresh();
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">タイムカード</h1>
          <p className="text-sm text-neutral-500 mt-0.5">出退勤管理</p>
        </div>
        <button
          onClick={() => setModal({ mode: "add" })}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          手動入力
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Today's punch card */}
      {isCurrentMonth && currentUserName && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-neutral-400" />
            <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              本日の打刻 — {currentUserName}
            </span>
          </div>
          {!todayCard ? (
            <div className="flex items-center gap-4">
              <p className="text-sm text-neutral-400">未打刻</p>
              <button
                onClick={handleClockIn}
                disabled={loading}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <LogIn size={15} />
                出勤
              </button>
            </div>
          ) : !todayCard.clock_out ? (
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <p className="text-xs text-neutral-400 mb-0.5">出勤</p>
                <p className="text-lg font-bold tabular-nums text-blue-600 dark:text-blue-400">
                  {toJSTTime(todayCard.clock_in)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs text-neutral-400 mb-0.5">休憩（分）</p>
                  <BreakInput timecardId={todayCard.id} initialBreak={todayCard.break_minutes} />
                </div>
                <button
                  onClick={handleClockOut}
                  disabled={loading}
                  className="flex items-center gap-1.5 bg-neutral-800 dark:bg-neutral-200 hover:bg-neutral-700 dark:hover:bg-neutral-300 disabled:opacity-40 text-white dark:text-neutral-900 text-sm font-medium px-4 py-2 rounded-lg transition-colors mt-4"
                >
                  <LogOut size={15} />
                  退勤
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <p className="text-xs text-neutral-400 mb-0.5">出勤</p>
                <p className="text-base font-bold tabular-nums text-neutral-800 dark:text-neutral-200">
                  {toJSTTime(todayCard.clock_in)}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-400 mb-0.5">退勤</p>
                <p className="text-base font-bold tabular-nums text-neutral-800 dark:text-neutral-200">
                  {toJSTTime(todayCard.clock_out)}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-400 mb-0.5">実働</p>
                <p className="text-base font-bold text-blue-600 dark:text-blue-400">
                  {fmtWorkTime(calcWorkMinutes(todayCard.clock_in, todayCard.clock_out, todayCard.break_minutes))}
                </p>
              </div>
              <span className="text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full">
                退勤済
              </span>
            </div>
          )}
        </div>
      )}

      {/* Month selector + summary */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 flex-wrap">
          {availableMonths.slice(0, 6).map((m) => (
            <button
              key={m}
              onClick={() => router.push(`/store/timecard?month=${m}`)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                m === currentMonth
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              {monthLabel(m)}
            </button>
          ))}
        </div>
        <div className="text-sm text-neutral-500">
          {monthLabel(currentMonth)} 合計: <span className="font-semibold text-neutral-800 dark:text-neutral-200">{fmtWorkTime(totalMinutes)}</span>
        </div>
      </div>

      {/* Staff filter */}
      {staffList.length > 1 && (
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setStaffFilter("all")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              staffFilter === "all"
                ? "bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
          >
            全員
          </button>
          {staffList.map((s) => (
            <button
              key={s}
              onClick={() => setStaffFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                staffFilter === s
                  ? "bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      {sortedDates.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-12 text-center">
          <p className="text-sm text-neutral-400">この月のデータはありません</p>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                <th className="text-left px-4 py-2.5 font-medium text-neutral-500 dark:text-neutral-400">日付</th>
                <th className="text-left px-4 py-2.5 font-medium text-neutral-500 dark:text-neutral-400">スタッフ</th>
                <th className="text-center px-3 py-2.5 font-medium text-neutral-500 dark:text-neutral-400">出勤</th>
                <th className="text-center px-3 py-2.5 font-medium text-neutral-500 dark:text-neutral-400">退勤</th>
                <th className="text-center px-3 py-2.5 font-medium text-neutral-500 dark:text-neutral-400 hidden sm:table-cell">休憩</th>
                <th className="text-center px-3 py-2.5 font-medium text-neutral-500 dark:text-neutral-400">実働</th>
                <th className="text-left px-3 py-2.5 font-medium text-neutral-500 dark:text-neutral-400 hidden lg:table-cell">メモ</th>
                <th className="px-3 py-2.5 w-20" />
              </tr>
            </thead>
            <tbody>
              {sortedDates.map((date) =>
                grouped[date].map((tc, i) => {
                  const workMin = calcWorkMinutes(tc.clock_in, tc.clock_out, tc.break_minutes);
                  const isToday = date === todayStr;
                  return (
                    <tr
                      key={tc.id}
                      className={`border-b border-neutral-100 dark:border-neutral-800 last:border-0 transition-colors ${
                        isToday ? "bg-blue-50/50 dark:bg-blue-900/5" : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                      }`}
                    >
                      <td className="px-4 py-2.5">
                        {i === 0 ? (
                          <div>
                            <span className={`text-sm font-medium ${isToday ? "text-blue-600 dark:text-blue-400" : "text-neutral-800 dark:text-neutral-200"}`}>
                              {date}
                            </span>
                            {isToday && <span className="ml-1.5 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">今日</span>}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-2.5 text-neutral-800 dark:text-neutral-200 font-medium">{tc.staff_name}</td>
                      <td className="px-3 py-2.5 text-center tabular-nums text-neutral-700 dark:text-neutral-300">
                        {toJSTTime(tc.clock_in)}
                      </td>
                      <td className="px-3 py-2.5 text-center tabular-nums text-neutral-700 dark:text-neutral-300">
                        {toJSTTime(tc.clock_out)}
                      </td>
                      <td className="px-3 py-2.5 text-center text-neutral-500 hidden sm:table-cell">
                        {tc.break_minutes > 0 ? `${tc.break_minutes}分` : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-center font-medium text-blue-600 dark:text-blue-400 tabular-nums">
                        {fmtWorkTime(workMin)}
                      </td>
                      <td className="px-3 py-2.5 text-neutral-400 text-xs hidden lg:table-cell truncate max-w-32">
                        {tc.notes || "-"}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setModal({ mode: "edit", row: tc })}
                            className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(tc.id)}
                            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <TimecardModal
          modal={modal}
          defaultStaffName={modal.mode === "add" ? currentUserName : modal.row.staff_name}
          todayStr={todayStr}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); router.refresh(); }}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 shadow-xl w-80">
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">この記録を削除しますか？</p>
            <p className="text-xs text-neutral-400 mb-5">削除すると元に戻せません。</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-lg text-sm border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                キャンセル
              </button>
              <button onClick={handleDelete} disabled={loading} className="px-4 py-2 rounded-lg text-sm bg-red-600 hover:bg-red-700 text-white disabled:opacity-40">
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Break input (inline) ──────────────────────────────────────────────────────

function BreakInput({ timecardId, initialBreak }: { timecardId: string; initialBreak: number }) {
  const router = useRouter();
  const [val, setVal] = useState(String(initialBreak));
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    const result = await (async () => {
      const supabase = (await import("@/utils/supabase/client")).createClient();
      const { error } = await supabase
        .from("timecards")
        .update({ break_minutes: parseInt(val) || 0 })
        .eq("id", timecardId);
      return { error: error?.message };
    })();
    if (!result.error) { setSaved(true); setTimeout(() => setSaved(false), 2000); router.refresh(); }
  };

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min="0"
        step="5"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-16 text-center rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
      />
      <button onClick={handleSave} className="p-1 rounded text-neutral-400 hover:text-blue-600 transition-colors">
        {saved ? <Check size={14} className="text-blue-500" /> : <Check size={14} />}
      </button>
    </div>
  );
}

// ── Timecard Modal ────────────────────────────────────────────────────────────

function TimecardModal({
  modal,
  defaultStaffName,
  todayStr,
  onClose,
  onSaved,
}: {
  modal: { mode: "add" } | { mode: "edit"; row: TimecardRow };
  defaultStaffName: string;
  todayStr: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const row = modal.mode === "edit" ? modal.row : null;

  const [staffName, setStaffName] = useState(row?.staff_name ?? defaultStaffName);
  const [date, setDate] = useState(row?.date ?? todayStr);
  const [clockInTime, setClockInTime] = useState(toJSTTimeInput(row?.clock_in ?? null));
  const [clockOutTime, setClockOutTime] = useState(toJSTTimeInput(row?.clock_out ?? null));
  const [breakMin, setBreakMin] = useState(String(row?.break_minutes ?? 0));
  const [notes, setNotes] = useState(row?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!staffName.trim() || !date) { setError("スタッフ名と日付は必須です"); return; }
    setSaving(true);
    setError(null);
    const result = await upsertTimecard({
      id: row?.id,
      staff_name: staffName.trim(),
      date,
      clock_in: clockInTime ? jstToISO(date, clockInTime) : "",
      clock_out: clockOutTime ? jstToISO(date, clockOutTime) : "",
      break_minutes: parseInt(breakMin) || 0,
      notes,
    }) as { error?: string };
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {modal.mode === "add" ? "打刻を手動入力" : "打刻を編集"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-neutral-500 mb-1">スタッフ名</label>
              <input
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-neutral-500 mb-1">日付</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">出勤時刻</label>
              <input
                type="time"
                value={clockInTime}
                onChange={(e) => setClockInTime(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">退勤時刻</label>
              <input
                type="time"
                value={clockOutTime}
                onChange={(e) => setClockOutTime(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">休憩（分）</label>
              <input
                type="number"
                min="0"
                step="5"
                value={breakMin}
                onChange={(e) => setBreakMin(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">メモ</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 pb-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800">
            キャンセル
          </button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-medium">
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
