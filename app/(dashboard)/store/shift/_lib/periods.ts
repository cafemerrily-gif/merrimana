export type Period = { year: number; half: 1 | 2 };

export type WeeklyShiftRow = {
  id: string;
  period_key: string;
  day_of_week: number; // 0=月, 1=火, 2=水, 3=木, 4=金, 5=土, 6=日
  staff_name: string;
  start_time: string; // 'HH:MM'
  end_time: string;   // 'HH:MM'
  notes: string;
};

export function getCurrentPeriod(date: Date): Period {
  const m = date.getMonth() + 1;
  if (m >= 4 && m <= 9) return { year: date.getFullYear(), half: 1 };
  if (m >= 10) return { year: date.getFullYear(), half: 2 };
  return { year: date.getFullYear() - 1, half: 2 };
}

export function getPeriodRange(p: Period): { start: string; end: string } {
  if (p.half === 1) return { start: `${p.year}-04-01`, end: `${p.year}-09-30` };
  return { start: `${p.year}-10-01`, end: `${p.year + 1}-03-31` };
}

export function getPeriodKey(p: Period): string {
  return `${p.year}-H${p.half}`;
}

export function parsePeriodKey(key: string): Period | null {
  const m = key.match(/^(\d{4})-H([12])$/);
  if (!m) return null;
  return { year: parseInt(m[1]), half: parseInt(m[2]) as 1 | 2 };
}

export function getPeriodMonths(p: Period): Array<{ year: number; month: number }> {
  if (p.half === 1) {
    return Array.from({ length: 6 }, (_, i) => ({ year: p.year, month: i + 4 }));
  }
  return [
    { year: p.year,     month: 10 },
    { year: p.year,     month: 11 },
    { year: p.year,     month: 12 },
    { year: p.year + 1, month: 1 },
    { year: p.year + 1, month: 2 },
    { year: p.year + 1, month: 3 },
  ];
}
