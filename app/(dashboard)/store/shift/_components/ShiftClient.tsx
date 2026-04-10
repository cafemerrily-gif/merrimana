"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { upsertShift, deleteShift } from "@/app/actions/store";
import {
  type ShiftRow,
  type Period,
  parsePeriodKey,
  getPeriodMonths,
  getPeriodRange,
} from "../_lib/periods";

// ── Helpers ──────────────────────────────────────────────────────────────────

const WEEK_DAYS = ["月", "火", "水", "木", "金", "土", "日"];

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  ホール:       { bg: "bg-blue-100 dark:bg-blue-900/40",   text: "text-blue-700 dark:text-blue-300" },
  キッチン:     { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300" },
  バリスタ:     { bg: "bg-purple-100 dark:bg-purple-900/40", text: "text-purple-700 dark:text-purple-300" },
  マネージャー: { bg: "bg-neutral-200 dark:bg-neutral-700", text: "text-neutral-700 dark:text-neutral-300" },
};

function getRoleStyle(role: string) {
  return ROLE_COLORS[role] ?? { bg: "bg-neutral-100 dark:bg-neutral-800", text: "text-neutral-600 dark:text-neutral-400" };
}

function periodLabel(p: Period): string {
  return `${p.year}年${p.half === 1 ? "上半期" : "下半期"}`;
}

function monthLabel(year: number, month: number): string {
  return `${year}年${month}月`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function firstWeekday(year: number, month: number): number {
  const d = new Date(year, month - 1, 1).getDay();
  return d === 0 ? 6 : d - 1; // 0=Mon
}

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ModalState =
  | { mode: "add"; date: string }
  | { mode: "edit"; shift: ShiftRow }
  | null;

type ViewMode = "calendar" | "staff";

// ── Component ─────────────────────────────────────────────────────────────────

export default function ShiftClient({
  shifts,
  currentPeriodKey,
  availablePeriodKeys,
  todayStr,
}: {
  shifts: ShiftRow[];
  currentPeriodKey: string;
  availablePeriodKeys: string[];
  todayStr: string;
}) {
  const router = useRouter();
  const period = parsePeriodKey(currentPeriodKey)!;
  const months = getPeriodMonths(period);

  // Default to current month if in this period, else first month of period
  const todayYear = parseInt(todayStr.slice(0, 4));
  const todayMonth = parseInt(todayStr.slice(5, 7));
  const defaultMonthIdx = months.findIndex(
    (m) => m.year === todayYear && m.month === todayMonth
  );
  const [monthIdx, setMonthIdx] = useState(defaultMonthIdx >= 0 ? defaultMonthIdx : 0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<ShiftRow | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { year: mYear, month: mMonth } = months[monthIdx];
  const totalDays = daysInMonth(mYear, mMonth);
  const firstDay = firstWeekday(mYear, mMonth);
  const calendarCells = [
    ...Array<null>(firstDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  // Shifts for current month
  const monthStart = dateStr(mYear, mMonth, 1);
  const monthEnd = dateStr(mYear, mMonth, totalDays);
  const monthShifts = shifts.filter((s) => s.date >= monthStart && s.date <= monthEnd);

  // Shift map by date
  const shiftMap = useMemo(() => {
    const map: Record<string, ShiftRow[]> = {};
    for (const s of monthShifts) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [monthShifts]);

  // All unique staff in this period
  const allStaff = useMemo(
    () => Array.from(new Set(shifts.map((s) => s.staff_name))).sort(),
    [shifts]
  );

  const dayShifts = selectedDate ? (shiftMap[selectedDate] ?? []) : [];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    const result = (await deleteShift(deleteTarget.id)) as { error?: string };
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setDeleteTarget(null);
    router.refresh();
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">シフト表</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{periodLabel(period)}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden text-sm">
            {(["calendar", "staff"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  viewMode === v
                    ? "bg-blue-600 text-white"
                    : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                }`}
              >
                {v === "calendar" ? "カレンダー" : "スタッフ別"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setModal({ mode: "add", date: selectedDate ?? todayStr })}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            シフト追加
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Period selector */}
      <div className="flex gap-1 flex-wrap">
        {availablePeriodKeys.map((key) => {
          const p = parsePeriodKey(key)!;
          return (
            <button
              key={key}
              onClick={() => router.push(`/store/shift?period=${key}`)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                key === currentPeriodKey
                  ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              {periodLabel(p)}
            </button>
          );
        })}
      </div>

      {/* Month tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {months.map((m, i) => (
          <button
            key={i}
            onClick={() => { setMonthIdx(i); setSelectedDate(null); }}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              i === monthIdx
                ? "bg-blue-600 text-white"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
          >
            {m.month}月
          </button>
        ))}
      </div>

      {viewMode === "calendar" ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Calendar */}
          <div className="xl:col-span-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 dark:border-neutral-800">
              <button
                onClick={() => { setMonthIdx((i) => Math.max(0, i - 1)); setSelectedDate(null); }}
                disabled={monthIdx === 0}
                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <h3 className="font-semibold text-neutral-800 dark:text-neutral-200">
                {monthLabel(mYear, mMonth)}
              </h3>
              <button
                onClick={() => { setMonthIdx((i) => Math.min(months.length - 1, i + 1)); setSelectedDate(null); }}
                disabled={monthIdx === months.length - 1}
                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="p-3">
              {/* Week header */}
              <div className="grid grid-cols-7 mb-1">
                {WEEK_DAYS.map((d, i) => (
                  <div
                    key={d}
                    className={`text-center text-xs font-medium py-1 ${
                      i === 5 ? "text-blue-500" : i === 6 ? "text-red-400" : "text-neutral-400"
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>
              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((day, idx) => {
                  if (!day) return <div key={`e-${idx}`} />;
                  const ds = dateStr(mYear, mMonth, day);
                  const dayShiftList = shiftMap[ds] ?? [];
                  const isToday = ds === todayStr;
                  const isSelected = ds === selectedDate;
                  const col = idx % 7;
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(isSelected ? null : ds)}
                      className={`min-h-16 p-1 rounded-lg text-left flex flex-col gap-0.5 transition-colors border ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      }`}
                    >
                      <span
                        className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-0.5 ${
                          isToday
                            ? "bg-blue-600 text-white"
                            : col === 5
                            ? "text-blue-500"
                            : col === 6
                            ? "text-red-400"
                            : "text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        {day}
                      </span>
                      {dayShiftList.slice(0, 2).map((s) => {
                        const style = getRoleStyle(s.role);
                        return (
                          <span
                            key={s.id}
                            className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate w-full ${style.bg} ${style.text}`}
                          >
                            {s.staff_name}
                          </span>
                        );
                      })}
                      {dayShiftList.length > 2 && (
                        <span className="text-[10px] text-neutral-400">+{dayShiftList.length - 2}人</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Day detail */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
            {selectedDate ? (
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                  <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    {selectedDate}
                  </h3>
                  <button
                    onClick={() => setModal({ mode: "add", date: selectedDate })}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Plus size={13} />
                    追加
                  </button>
                </div>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {dayShifts.length === 0 ? (
                    <p className="text-sm text-neutral-400 p-5 text-center">シフトなし</p>
                  ) : (
                    dayShifts.map((s) => {
                      const style = getRoleStyle(s.role);
                      return (
                        <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${style.bg} ${style.text}`}>
                            {s.role || "—"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{s.staff_name}</p>
                            <p className="text-xs text-neutral-400 tabular-nums">{s.start_time}〜{s.end_time}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => setModal({ mode: "edit", shift: s })}
                              className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-600 transition-colors"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(s)}
                              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-neutral-400">
                <CalendarDays size={28} className="opacity-40" />
                <p className="text-sm">日付を選択して詳細を表示</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Staff view */
        <StaffView
          allStaff={allStaff}
          year={mYear}
          month={mMonth}
          totalDays={totalDays}
          shiftMap={shiftMap}
          todayStr={todayStr}
          onAdd={(date) => setModal({ mode: "add", date })}
          onEdit={(s) => setModal({ mode: "edit", shift: s })}
          onDelete={(s) => setDeleteTarget(s)}
        />
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(ROLE_COLORS).map(([role, style]) => (
          <span key={role} className={`text-xs px-2 py-0.5 rounded font-medium ${style.bg} ${style.text}`}>
            {role}
          </span>
        ))}
      </div>

      {/* Add/Edit modal */}
      {modal && (
        <ShiftModal
          modal={modal}
          allStaff={allStaff}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); router.refresh(); }}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 shadow-xl w-80">
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
              このシフトを削除しますか？
            </p>
            <p className="text-xs text-neutral-400 mb-1">{deleteTarget.staff_name} / {deleteTarget.date}</p>
            <p className="text-xs text-neutral-400 mb-5">{deleteTarget.start_time}〜{deleteTarget.end_time}</p>
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

// ── Staff View ─────────────────────────────────────────────────────────────────

function StaffView({
  allStaff,
  year,
  month,
  totalDays,
  shiftMap,
  todayStr,
  onAdd,
  onEdit,
  onDelete,
}: {
  allStaff: string[];
  year: number;
  month: number;
  totalDays: number;
  shiftMap: Record<string, ShiftRow[]>;
  todayStr: string;
  onAdd: (date: string) => void;
  onEdit: (s: ShiftRow) => void;
  onDelete: (s: ShiftRow) => void;
}) {
  const days = Array.from({ length: totalDays }, (_, i) => {
    const d = i + 1;
    const ds = dateStr(year, month, d);
    const dow = new Date(year, month - 1, d).getDay();
    return { day: d, dateStr: ds, dow };
  });

  if (allStaff.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-12 text-center">
        <p className="text-sm text-neutral-400">この期間にシフトがありません</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse" style={{ minWidth: `${120 + totalDays * 52}px` }}>
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
              <th className="sticky left-0 bg-neutral-50 dark:bg-neutral-800/50 text-left px-4 py-2.5 font-medium text-neutral-500 min-w-28 z-10">
                スタッフ
              </th>
              {days.map(({ day, dateStr: ds, dow }) => (
                <th
                  key={day}
                  className={`px-1.5 py-2.5 text-center font-medium w-12 min-w-12 ${
                    ds === todayStr
                      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10"
                      : dow === 6
                      ? "text-blue-400"
                      : dow === 0
                      ? "text-red-400"
                      : "text-neutral-400"
                  }`}
                >
                  <div>{["日","月","火","水","木","金","土"][dow]}</div>
                  <div className={`font-bold ${ds === todayStr ? "text-blue-600 dark:text-blue-400" : ""}`}>{day}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allStaff.map((staff) => (
              <tr key={staff} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                <td className="sticky left-0 bg-white dark:bg-neutral-900 px-4 py-2 font-medium text-neutral-800 dark:text-neutral-200 z-10 border-r border-neutral-100 dark:border-neutral-800">
                  {staff}
                </td>
                {days.map(({ dateStr: ds }) => {
                  const staffShifts = (shiftMap[ds] ?? []).filter((s) => s.staff_name === staff);
                  const isToday = ds === todayStr;
                  return (
                    <td
                      key={ds}
                      className={`px-1 py-1 text-center align-middle ${
                        isToday ? "bg-blue-50/60 dark:bg-blue-900/10" : ""
                      }`}
                    >
                      {staffShifts.length > 0 ? (
                        staffShifts.map((s) => {
                          const style = getRoleStyle(s.role);
                          return (
                            <div
                              key={s.id}
                              className={`group relative px-1 py-0.5 rounded text-[10px] leading-tight cursor-pointer ${style.bg} ${style.text}`}
                              onClick={() => onEdit(s)}
                            >
                              <span className="tabular-nums">{s.start_time}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); onDelete(s); }}
                                className="absolute -top-1 -right-1 hidden group-hover:flex w-4 h-4 bg-red-500 text-white rounded-full items-center justify-center text-[9px] leading-none"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <button
                          onClick={() => onAdd(ds)}
                          className="w-full h-8 text-neutral-200 dark:text-neutral-700 hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors text-base"
                        >
                          +
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Shift Modal ────────────────────────────────────────────────────────────────

const COMMON_ROLES = ["ホール", "キッチン", "バリスタ", "マネージャー"];
const TIME_OPTIONS = Array.from({ length: 29 }, (_, i) => {
  const h = Math.floor(i / 2) + 8; // 08:00 to 22:00
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

function ShiftModal({
  modal,
  allStaff,
  onClose,
  onSaved,
}: {
  modal: { mode: "add"; date: string } | { mode: "edit"; shift: ShiftRow };
  allStaff: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const s = modal.mode === "edit" ? modal.shift : null;
  const [staffName, setStaffName] = useState(s?.staff_name ?? "");
  const [role, setRole] = useState(s?.role ?? "ホール");
  const [date, setDate] = useState(modal.mode === "add" ? modal.date : s?.date ?? "");
  const [startTime, setStartTime] = useState(s?.start_time ?? "09:00");
  const [endTime, setEndTime] = useState(s?.end_time ?? "17:00");
  const [notes, setNotes] = useState(s?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!staffName.trim() || !date || !startTime || !endTime) {
      setError("スタッフ名・日付・時間は必須です");
      return;
    }
    setSaving(true);
    setError(null);
    const result = (await upsertShift({
      id: s?.id,
      staff_name: staffName.trim(),
      role,
      date,
      start_time: startTime,
      end_time: endTime,
      notes,
    })) as { error?: string };
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {modal.mode === "add" ? "シフトを追加" : "シフトを編集"}
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
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">スタッフ名 *</label>
            <input
              list="staff-list"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="名前を入力または選択"
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <datalist id="staff-list">
              {allStaff.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">役割</label>
            <div className="flex gap-1.5 flex-wrap">
              {COMMON_ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    role === r
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  {r}
                </button>
              ))}
              <input
                value={COMMON_ROLES.includes(role) ? "" : role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="その他…"
                className="px-3 py-1 rounded-full text-xs border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-600 w-20"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">日付 *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">開始 *</label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">終了 *</label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
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
