/**
 * Cycle prediction engine — exact port from app.js lines 22-128.
 * All date strings are "YYYY-MM-DD" format.
 */
import type { Cycle, PhaseResult } from '../types';

// --- Date helpers ---

/** Date → "YYYY-MM-DD" (noon-safe to avoid DST issues) */
export function ymd(d: Date): string {
  const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

/** "YYYY-MM-DD" → Date (noon) */
export function fromYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

/** Add n days to a Date */
export function addDays(d: Date, n: number): Date {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
  t.setDate(t.getDate() + n);
  return t;
}

/** Days between two "YYYY-MM-DD" strings */
export function diff(a: string, b: string): number {
  return Math.round((fromYmd(a).getTime() - fromYmd(b).getTime()) / (24 * 60 * 60 * 1000));
}

/** "15 March 2025" */
export function nice(s: string): string {
  return fromYmd(s).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

/** "15 Mar" */
export function niceShort(s: string): string {
  return fromYmd(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/** "15th of Mar, 2025" */
export function niceFull(s: string): string {
  const d = fromYmd(s);
  const day = d.getDate();
  const month = d.toLocaleDateString(undefined, { month: 'short' });
  const year = d.getFullYear();

  let suffix = 'th';
  if (day % 10 === 1 && day !== 11) suffix = 'st';
  else if (day % 10 === 2 && day !== 12) suffix = 'nd';
  else if (day % 10 === 3 && day !== 13) suffix = 'rd';

  return `${day}${suffix} of ${month}, ${year}`;
}

// --- Stats ---

function cycleLens(starts: string[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < starts.length; i++) out.push(diff(starts[i], starts[i - 1]));
  return out;
}

function median(arr: number[]): number {
  if (!arr.length) return NaN;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export interface CycleStats {
  med: number;
  starts: string[];
}

export function getCycleStats(cycles: Cycle[]): CycleStats | null {
  if (!cycles.length) return null;
  const sorted = [...cycles].sort((a, b) => a.start.localeCompare(b.start));
  const starts = sorted.map(c => c.start);
  const lens = cycleLens(starts);
  const med = lens.length ? Math.round(median(lens)) : 28;
  return { med, starts };
}

// --- Core Prediction Logic ---

export function getPhaseForDate(dateStr: string, cycles: Cycle[]): PhaseResult | null {
  const stats = getCycleStats(cycles);
  if (!stats) return null;

  // 1. Check if inside a recorded period (Exact Match)
  const recorded = cycles.find(c => c.end && dateStr >= c.start && dateStr <= c.end);
  if (recorded) {
    return { type: 'period', day: diff(dateStr, recorded.start) + 1, recorded: true };
  }

  // 2. Find "Anchor" Cycle (Latest start date <= dateStr)
  const anchorStart = stats.starts.filter(s => s <= dateStr).pop();

  if (!anchorStart) {
    return { type: 'future', msg: 'No data yet' };
  }

  // 3. Calculate Position in Cycle
  const daysSince = diff(dateStr, anchorStart);
  const dayInCycle = daysSince % stats.med; // 0 to med-1
  const cycleNum = Math.floor(daysSince / stats.med);

  // LIMIT PREDICTIONS:
  if (cycleNum > 1) return null;

  // Calculate Key Days
  const med = stats.med;
  const ovuDay = med - 14;
  let fertileStart = ovuDay - 5;
  const fertileEnd = ovuDay + 1;

  // Determine Period Length for Anchor
  let periodLen = 5;
  const anchorObj = cycles.find(c => c.start === anchorStart);
  if (anchorObj && anchorObj.end) {
    periodLen = diff(anchorObj.end, anchorObj.start) + 1;
  }

  // Determine Phase
  if (dayInCycle >= 0 && dayInCycle < periodLen) {
    return { type: 'period', day: dayInCycle + 1, recorded: false };
  }

  // If we are in Cycle 1 (Next Cycle), ONLY show period.
  if (cycleNum === 1) return null;

  // FERTILITY GAP FIX
  if (dayInCycle >= periodLen && dayInCycle < fertileStart) {
    fertileStart = periodLen;
  }

  if (dayInCycle >= fertileStart && dayInCycle <= fertileEnd) {
    const isOvu = (dayInCycle === ovuDay);
    return {
      type: isOvu ? 'ovulation' : 'fertile',
      day: dayInCycle,
      fertileStart: addDays(fromYmd(anchorStart), (cycleNum * med) + fertileStart),
      fertileEnd: addDays(fromYmd(anchorStart), (cycleNum * med) + fertileEnd),
    };
  }
  if (dayInCycle > fertileEnd) {
    return { type: 'luteal', day: dayInCycle };
  }

  return { type: 'follicular', day: dayInCycle };
}

// --- Next Period Calculation (from renderDashboard) ---

export function getNextPeriodDate(cycles: Cycle[]): { date: string; daysToNext: number } | null {
  const stats = getCycleStats(cycles);
  if (!stats) return null;

  const todayYmd = ymd(new Date());
  const anchorStart = stats.starts.filter(s => s <= todayYmd).pop() || stats.starts[0];

  let nextStart: string | null = null;

  if (anchorStart) {
    let k = 0;
    while (k < 1000) {
      const candidate = ymd(addDays(fromYmd(anchorStart), (k + 1) * stats.med));
      if (candidate > todayYmd) {
        nextStart = candidate;
        break;
      }
      k++;
    }
  } else {
    nextStart = stats.starts[0];
  }

  if (!nextStart) return null;

  const daysToNext = diff(nextStart, todayYmd);
  return { date: nextStart, daysToNext };
}

/** Get current cycle day (1-based) relative to most recent cycle start */
export function getCurrentCycleDay(cycles: Cycle[]): number | null {
  const stats = getCycleStats(cycles);
  if (!stats) return null;

  const todayYmd = ymd(new Date());
  const anchorStart = stats.starts.filter(s => s <= todayYmd).pop();
  if (!anchorStart) return null;

  return diff(todayYmd, anchorStart) + 1;
}
