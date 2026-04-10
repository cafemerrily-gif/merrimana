"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, X, CalendarDays, BarChart2 } from "lucide-react";
import { upsertWeeklyShift, deleteWeeklyShift } from "@/app/actions/store";
import {
  type WeeklyShiftRow,
  type Period,
  parsePeriodKey,
  getPeriodMonths,
} from "../_lib/periods";

// ── Helpers ───────────────────────────────────────────────────────────────────

const WEEK_DAYS = ["月", "火", "水", "木", "金", "土", "日"];

// JS の getDay() (0=日,1=月,...,6=土) → 内部連番 (0=月,...,6=日)
function jsDowToMyDow(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

function periodLabel(p: Period): string {
  return `${p.year}年${p.half === 1 ? "上半期" : "下半期"}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function firstWeekday(year: number, month: number): number {
  const d = new Date(year, month - 1, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ViewMode = "calendar" | "chart";

type ModalState =
  | { mode: "add"; day_of_week?: number }
  | { mode: "edit"; shift: WeeklyShiftRow }
  | null;

// ── Main Component ────────────────────────────────────────────────────────────

export default function ShiftClient({
  weeklyShifts,
  staffList,
  currentPeriodKey,
  availablePeriodKeys,
  todayStr,
}: {
  weeklyShifts: WeeklyShiftRow[];
  staffList: string[];
  currentPeriodKey: string;
  availablePeriodKeys: string[];
  todayStr: string;
}) {
  const router = useRouter();
  const period = parsePeriodKey(currentPeriodKey)!;
  const months = getPeriodMonths(period);

  const todayYear = parseInt(todayStr.slice(0, 4));
  const todayMonth = parseInt(todayStr.slice(5, 7));
  const defaultMonthIdx = months.findIndex(
    (m) => m.year === todayYear && m.month === todayMonth
  );
  const [monthIdx, setMonthIdx] = useState(defaultMonthIdx >= 0 ? defaultMonthIdx : 0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<WeeklyShiftRow | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [chartDow, setChartDow] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { year: mYear, month: mMonth } = months[monthIdx];
  const totalDays = daysInMonth(mYear, mMonth);
  const firstDay = firstWeekday(mYear, mMonth);
  const calendarCells = [
    ...Array<null>(firstDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  // シフトを曜日でグループ化
  const shiftsByDow = useMemo(() => {
    const map: Record<number, WeeklyShiftRow[]> = {};
    for (let i = 0; i < 7; i++) map[i] = [];
    for (const s of weeklyShifts) {
      (map[s.day_of_week] ??= []).push(s);
    }
    return map;
  }, [weeklyShifts]);

  // 選択中の日付の曜日からシフトを取得
  const selectedDow =
    selectedDate !== null
      ? jsDowToMyDow(new Date(selectedDate + "T00:00:00").getDay())
      : null;
  const selectedDayShifts = selectedDow !== null ? (shiftsByDow[selectedDow] ?? []) : [];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    const result = (await deleteWeeklyShift(deleteTarget.id)) as { error?: string };
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setDeleteTarget(null);
    router.refresh();
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">シフト表</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{periodLabel(period)}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* ビュー切替 */}
          <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden text-sm">
            {(["calendar", "chart"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  viewMode === v
                    ? "bg-blue-600 text-white"
                    : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                }`}
              >
                {v === "calendar" ? "カレンダー" : "棒グラフ"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setModal({ mode: "add" })}
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

      {/* 半期セレクタ */}
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

      {viewMode === "calendar" ? (
        <>
          {/* 月タブ */}
          <div className="flex gap-1 overflow-x-auto pb-1">
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

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* カレンダー */}
            <div className="xl:col-span-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
              <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 text-center">
                <h3 className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {mYear}年{mMonth}月
                </h3>
              </div>
              <div className="p-3">
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
                <div className="grid grid-cols-7 gap-1">
                  {calendarCells.map((day, idx) => {
                    if (!day) return <div key={`e-${idx}`} />;
                    const ds = dateStr(mYear, mMonth, day);
                    const dow = jsDowToMyDow(new Date(ds + "T00:00:00").getDay());
                    const dayShiftList = shiftsByDow[dow] ?? [];
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
                        {dayShiftList.slice(0, 2).map((s) => (
                          <span
                            key={s.id}
                            className="text-[10px] leading-tight px-1 py-0.5 rounded truncate w-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                          >
                            {s.staff_name}
                          </span>
                        ))}
                        {dayShiftList.length > 2 && (
                          <span className="text-[10px] text-neutral-400">+{dayShiftList.length - 2}人</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 日付詳細パネル */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
              {selectedDate && selectedDow !== null ? (
                <>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                    <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                      {selectedDate}（{WEEK_DAYS[selectedDow]}）
                    </h3>
                    <button
                      onClick={() => setModal({ mode: "add", day_of_week: selectedDow })}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Plus size={13} />
                      追加
                    </button>
                  </div>
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {selectedDayShifts.length === 0 ? (
                      <p className="text-sm text-neutral-400 p-5 text-center">シフトなし</p>
                    ) : (
                      selectedDayShifts.map((s) => (
                        <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                              {s.staff_name}
                            </p>
                            <p className="text-xs text-neutral-400 tabular-nums">
                              {s.start_time}〜{s.end_time}
                            </p>
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
                      ))
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
        </>
      ) : (
        /* 棒グラフビュー */
        <BarChartView
          shiftsByDow={shiftsByDow}
          chartDow={chartDow}
          setChartDow={setChartDow}
          onEdit={(s) => setModal({ mode: "edit", shift: s })}
          onDelete={(s) => setDeleteTarget(s)}
          onAdd={(dow) => setModal({ mode: "add", day_of_week: dow })}
        />
      )}

      {/* シフト追加/編集モーダル */}
      {modal && (
        <WeeklyShiftModal
          modal={modal}
          staffList={staffList}
          periodKey={currentPeriodKey}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); router.refresh(); }}
        />
      )}

      {/* 削除確認 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 shadow-xl w-80">
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
              このシフトを削除しますか？
            </p>
            <p className="text-xs text-neutral-400 mb-1">
              {deleteTarget.staff_name} / {WEEK_DAYS[deleteTarget.day_of_week]}曜日
            </p>
            <p className="text-xs text-neutral-400 mb-5">
              {deleteTarget.start_time}〜{deleteTarget.end_time}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg text-sm border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 棒グラフビュー ──────────────────────────────────────────────────────────────

const CHART_START_MIN = 8 * 60;  // 08:00
const CHART_END_MIN   = 22 * 60; // 22:00
const CHART_DURATION  = CHART_END_MIN - CHART_START_MIN; // 840分

const TIME_LABELS = Array.from({ length: 8 }, (_, i) => {
  const h = 8 + i * 2;
  return `${String(h).padStart(2, "0")}:00`;
});

function BarChartView({
  shiftsByDow,
  chartDow,
  setChartDow,
  onEdit,
  onDelete,
  onAdd,
}: {
  shiftsByDow: Record<number, WeeklyShiftRow[]>;
  chartDow: number;
  setChartDow: (d: number) => void;
  onEdit: (s: WeeklyShiftRow) => void;
  onDelete: (s: WeeklyShiftRow) => void;
  onAdd: (dow: number) => void;
}) {
  const shifts = shiftsByDow[chartDow] ?? [];

  const staffInDay = useMemo(
    () => Array.from(new Set(shifts.map((s) => s.staff_name))).sort(),
    [shifts]
  );

  return (
    <div className="space-y-4">
      {/* 曜日タブ */}
      <div className="flex gap-1 flex-wrap">
        {WEEK_DAYS.map((d, i) => (
          <button
            key={i}
            onClick={() => setChartDow(i)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              i === chartDow
                ? "bg-blue-600 text-white"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
          >
            {d}曜日
            {(shiftsByDow[i]?.length ?? 0) > 0 && (
              <span className="ml-1.5 text-[10px] opacity-70">
                {shiftsByDow[i].length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            {WEEK_DAYS[chartDow]}曜日のシフト
          </h3>
          <button
            onClick={() => onAdd(chartDow)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            <Plus size={13} />
            追加
          </button>
        </div>

        {shifts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-neutral-400">
            <BarChart2 size={28} className="opacity-40" />
            <p className="text-sm">この曜日にシフトはありません</p>
          </div>
        ) : (
          <div className="p-5 overflow-x-auto">
            {/* 時刻軸ヘッダー */}
            <div className="flex mb-1" style={{ paddingLeft: "140px" }}>
              <div className="relative flex-1 h-5">
                {TIME_LABELS.map((label, i) => (
                  <span
                    key={label}
                    className="absolute text-[10px] text-neutral-400 -translate-x-1/2 select-none"
                    style={{ left: `${(i / 7) * 100}%` }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* バー */}
            <div className="space-y-2">
              {staffInDay.map((staff) => {
                const staffShifts = shifts.filter((s) => s.staff_name === staff);
                return (
                  <div key={staff} className="flex items-center" style={{ minHeight: "36px" }}>
                    {/* スタッフ名（Y軸ラベル） */}
                    <div
                      className="shrink-0 text-sm font-medium text-neutral-700 dark:text-neutral-300 pr-3 text-right"
                      style={{ width: "140px" }}
                    >
                      {staff}
                    </div>
                    {/* バー領域 */}
                    <div className="relative flex-1 h-8 bg-neutral-50 dark:bg-neutral-800/50 rounded">
                      {/* グリッド線 */}
                      {TIME_LABELS.map((_, i) => (
                        <div
                          key={i}
                          className="absolute top-0 bottom-0 border-l border-neutral-200 dark:border-neutral-700"
                          style={{ left: `${(i / 7) * 100}%` }}
                        />
                      ))}
                      {/* シフトバー */}
                      {staffShifts.map((s) => {
                        const startMin = timeToMin(s.start_time);
                        const endMin   = timeToMin(s.end_time);
                        const left  = Math.max(0, (startMin - CHART_START_MIN) / CHART_DURATION) * 100;
                        const width = Math.max(0, (endMin - startMin) / CHART_DURATION) * 100;
                        return (
                          <div
                            key={s.id}
                            className="absolute top-1 bottom-1 rounded bg-blue-400 dark:bg-blue-600 cursor-pointer group hover:bg-blue-500 dark:hover:bg-blue-500 transition-colors flex items-center overflow-hidden"
                            style={{ left: `${left}%`, width: `${width}%` }}
                            onClick={() => onEdit(s)}
                            title={`${s.start_time}〜${s.end_time}${s.notes ? `\n${s.notes}` : ""}`}
                          >
                            <span className="text-[10px] text-white font-medium px-1.5 truncate select-none">
                              {s.start_time}〜{s.end_time}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); onDelete(s); }}
                              className="absolute right-0.5 top-0.5 w-3.5 h-3.5 hidden group-hover:flex items-center justify-center bg-red-500 rounded-full text-white text-[9px] leading-none"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── シフトモーダル ─────────────────────────────────────────────────────────────

const TIME_OPTIONS = Array.from({ length: 29 }, (_, i) => {
  const h = Math.floor(i / 2) + 8; // 08:00〜22:00
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

function WeeklyShiftModal({
  modal,
  staffList,
  periodKey,
  onClose,
  onSaved,
}: {
  modal: { mode: "add"; day_of_week?: number } | { mode: "edit"; shift: WeeklyShiftRow };
  staffList: string[];
  periodKey: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const s = modal.mode === "edit" ? modal.shift : null;
  const [staffName, setStaffName] = useState(
    s?.staff_name ?? staffList[0] ?? ""
  );
  const [dow, setDow] = useState<number>(
    s?.day_of_week ?? (modal.mode === "add" ? (modal.day_of_week ?? 0) : 0)
  );
  const [startTime, setStartTime] = useState(s?.start_time ?? "09:00");
  const [endTime,   setEndTime]   = useState(s?.end_time   ?? "17:00");
  const [notes,     setNotes]     = useState(s?.notes      ?? "");
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const handleSave = async () => {
    if (!staffName || !startTime || !endTime) {
      setError("スタッフ・時間は必須です");
      return;
    }
    setSaving(true);
    setError(null);
    const result = (await upsertWeeklyShift({
      id: s?.id,
      period_key: periodKey,
      day_of_week: dow,
      staff_name: staffName,
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
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* スタッフ選択 */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">スタッフ *</label>
            {staffList.length === 0 ? (
              <p className="text-sm text-neutral-400 bg-neutral-50 dark:bg-neutral-800 rounded-lg px-3 py-2">
                スタッフが登録されていません（システム管理から追加してください）
              </p>
            ) : (
              <select
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {staffList.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            )}
          </div>

          {/* 曜日選択 */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">曜日 *</label>
            <div className="flex gap-1 flex-wrap">
              {WEEK_DAYS.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setDow(i)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    dow === i
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* 時間 */}
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

          {/* メモ */}
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
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving || staffList.length === 0}
            className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-medium"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
