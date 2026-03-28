import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  ymd,
  fromYmd,
  addDays,
  diff,
  niceFull,
  getCycleStats,
  getPhaseForDate,
  getNextPeriodDate,
  getCurrentCycleDay,
} from '../cycle-math';
import type { Cycle } from '../../types';

// ---------------------------------------------------------------------------
// ymd
// ---------------------------------------------------------------------------

describe('ymd', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(ymd(new Date(2026, 2, 15))).toBe('2026-03-15');
  });

  it('pads single-digit month and day', () => {
    expect(ymd(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('is noon-safe: midnight input gives the correct date string', () => {
    // Creating a Date at midnight could shift under DST — the function pins to noon
    const midnight = new Date(2026, 2, 15, 0, 0, 0);
    expect(ymd(midnight)).toBe('2026-03-15');
  });
});

// ---------------------------------------------------------------------------
// fromYmd
// ---------------------------------------------------------------------------

describe('fromYmd', () => {
  it('parses YYYY-MM-DD to a Date at noon', () => {
    const d = fromYmd('2026-03-15');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2); // 0-indexed, March = 2
    expect(d.getDate()).toBe(15);
    expect(d.getHours()).toBe(12);
  });

  it('round-trips with ymd', () => {
    const original = '2026-07-04';
    expect(ymd(fromYmd(original))).toBe(original);
  });
});

// ---------------------------------------------------------------------------
// addDays
// ---------------------------------------------------------------------------

describe('addDays', () => {
  it('adds positive days within a month', () => {
    expect(ymd(addDays(fromYmd('2026-01-20'), 7))).toBe('2026-01-27');
  });

  it('crosses a month boundary', () => {
    expect(ymd(addDays(fromYmd('2026-01-28'), 5))).toBe('2026-02-02');
  });

  it('crosses a year boundary', () => {
    expect(ymd(addDays(fromYmd('2026-12-28'), 5))).toBe('2027-01-02');
  });

  it('subtracts days with a negative n', () => {
    expect(ymd(addDays(fromYmd('2026-02-05'), -7))).toBe('2026-01-29');
  });
});

// ---------------------------------------------------------------------------
// diff
// ---------------------------------------------------------------------------

describe('diff', () => {
  it('returns positive when a is after b', () => {
    expect(diff('2026-01-10', '2026-01-01')).toBe(9);
  });

  it('returns negative when a is before b', () => {
    expect(diff('2026-01-01', '2026-01-10')).toBe(-9);
  });

  it('returns 0 for the same date', () => {
    expect(diff('2026-03-15', '2026-03-15')).toBe(0);
  });

  it('counts calendar days across months', () => {
    // Jan 28 to Feb 4 = 3 days left in Jan + 4 days in Feb = 7
    expect(diff('2026-02-04', '2026-01-28')).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// niceFull — ordinal suffix branches
// ---------------------------------------------------------------------------

describe('niceFull ordinal suffixes', () => {
  it('uses "st" for 1', () => {
    expect(niceFull('2026-01-01')).toMatch(/^1st/);
  });

  it('uses "nd" for 2', () => {
    expect(niceFull('2026-01-02')).toMatch(/^2nd/);
  });

  it('uses "rd" for 3', () => {
    expect(niceFull('2026-01-03')).toMatch(/^3rd/);
  });

  it('uses "th" for 4', () => {
    expect(niceFull('2026-01-04')).toMatch(/^4th/);
  });

  // Teens are exceptions: 11th, 12th, 13th — NOT 11st, 12nd, 13rd
  it('uses "th" for 11 (not 11st)', () => {
    expect(niceFull('2026-01-11')).toMatch(/^11th/);
  });

  it('uses "th" for 12 (not 12nd)', () => {
    expect(niceFull('2026-01-12')).toMatch(/^12th/);
  });

  it('uses "th" for 13 (not 13rd)', () => {
    expect(niceFull('2026-01-13')).toMatch(/^13th/);
  });

  // Teens-plus-ten follow normal rules again
  it('uses "st" for 21', () => {
    expect(niceFull('2026-01-21')).toMatch(/^21st/);
  });

  it('uses "nd" for 22', () => {
    expect(niceFull('2026-01-22')).toMatch(/^22nd/);
  });

  it('uses "rd" for 23', () => {
    expect(niceFull('2026-01-23')).toMatch(/^23rd/);
  });

  it('uses "th" for 24', () => {
    expect(niceFull('2026-01-24')).toMatch(/^24th/);
  });
});

// ---------------------------------------------------------------------------
// getCycleStats
// ---------------------------------------------------------------------------

describe('getCycleStats', () => {
  it('returns null for empty cycles', () => {
    expect(getCycleStats([])).toBeNull();
  });

  it('returns fallback median (28) when only one cycle exists', () => {
    const cycles: Cycle[] = [{ start: '2026-01-01', end: '2026-01-05' }];
    const stats = getCycleStats(cycles);
    expect(stats).not.toBeNull();
    expect(stats!.med).toBe(28);
    expect(stats!.starts).toEqual(['2026-01-01']);
  });

  it('respects a custom fallback when only one cycle exists', () => {
    const cycles: Cycle[] = [{ start: '2026-01-01', end: null }];
    const stats = getCycleStats(cycles, 30);
    expect(stats!.med).toBe(30);
  });

  it('computes the correct median from two cycles', () => {
    const cycles: Cycle[] = [
      { start: '2026-01-01', end: '2026-01-05' },
      { start: '2026-01-29', end: '2026-02-02' },
    ];
    // diff('2026-01-29', '2026-01-01') = 28
    expect(getCycleStats(cycles)!.med).toBe(28);
  });

  it('sorts cycles by start before computing stats', () => {
    // Same two cycles as above, but provided out of order
    const cycles: Cycle[] = [
      { start: '2026-01-29', end: '2026-02-02' },
      { start: '2026-01-01', end: '2026-01-05' },
    ];
    expect(getCycleStats(cycles)!.med).toBe(28);
  });

  it('uses only the most recent 6 cycle lengths (not all)', () => {
    // 8 cycles: first 4 gaps = 40 days, last 3 gaps = 20 days
    // 7 lengths total: [40, 40, 40, 40, 20, 20, 20]
    // recent-6 = [40, 40, 40, 20, 20, 20] → sorted median = (20+40)/2 = 30
    // all-7 would give median = 40 (40 appears 4 times out of 7)
    const cycles: Cycle[] = [
      { start: '2026-01-01', end: null },
      { start: '2026-02-10', end: null }, // +40
      { start: '2026-03-22', end: null }, // +40
      { start: '2026-05-01', end: null }, // +40
      { start: '2026-06-10', end: null }, // +40
      { start: '2026-06-30', end: null }, // +20
      { start: '2026-07-20', end: null }, // +20
      { start: '2026-08-09', end: null }, // +20
    ];
    expect(getCycleStats(cycles)!.med).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// getPhaseForDate
// ---------------------------------------------------------------------------

describe('getPhaseForDate', () => {
  // Anchor cycle: 5-day period starting Jan 1. Median = 28 (default fallback).
  const baseCycles: Cycle[] = [
    { start: '2026-01-01', end: '2026-01-05' },
  ];

  it('returns null when there are no cycles', () => {
    expect(getPhaseForDate('2026-01-03', [])).toBeNull();
  });

  it('returns "future" when date is before any recorded cycle', () => {
    const result = getPhaseForDate('2025-06-01', baseCycles);
    expect(result?.type).toBe('future');
  });

  it('returns "period" (recorded: true) for a date inside a recorded period', () => {
    const result = getPhaseForDate('2026-01-03', baseCycles);
    expect(result?.type).toBe('period');
    expect(result?.recorded).toBe(true);
    expect(result?.day).toBe(3); // 3rd day of period
  });

  it('returns "follicular" for a day between period end and fertile window', () => {
    // dayInCycle = diff('2026-01-07', '2026-01-01') = 6
    // 6 >= 5 (periodLen) and 6 < 12 (fertileStart=max(5,28-16)) → follicular
    const result = getPhaseForDate('2026-01-07', baseCycles);
    expect(result?.type).toBe('follicular');
  });

  it('returns "fertile" for a day in the fertile window (not peak ovulation)', () => {
    // dayInCycle = diff('2026-01-13', '2026-01-01') = 12
    // fertileStart = max(5, 28-16) = 12, fertileEnd = 28-10 = 18
    // 12 in [12..18], but not in ovulation range [14..16] → fertile
    const result = getPhaseForDate('2026-01-13', baseCycles);
    expect(result?.type).toBe('fertile');
  });

  it('returns "ovulation" for a day in the peak ovulation window', () => {
    // dayInCycle = diff('2026-01-16', '2026-01-01') = 15
    // 15 in [12..18] and 15 in [14..16] → ovulation
    const result = getPhaseForDate('2026-01-16', baseCycles);
    expect(result?.type).toBe('ovulation');
  });

  it('returns "luteal" for a day after the fertile window', () => {
    // dayInCycle = diff('2026-01-21', '2026-01-01') = 20 > 18 → luteal
    const result = getPhaseForDate('2026-01-21', baseCycles);
    expect(result?.type).toBe('luteal');
  });

  it('returns predicted "period" (recorded: false) when no next actual cycle exists', () => {
    // daysSince = diff('2026-01-29', '2026-01-01') = 28 = med
    // cycleNum = 1, dayInCycle = 0 → predicted period day 1
    const result = getPhaseForDate('2026-01-29', baseCycles);
    expect(result?.type).toBe('period');
    expect(result?.recorded).toBe(false);
  });

  it('returns null (superseded) when a subsequent cycle has already been recorded', () => {
    // 3 cycles: gap[0]=40 days, gap[1]=23 days → median=32.
    // Querying '2026-02-05': 35 days after cycle-1 anchor (> med=32 → cycleNum=1).
    // Cycle 2 starts '2026-02-10' (after the anchor) → hasActualNextCycle=true → null.
    const cycles: Cycle[] = [
      { start: '2026-01-01', end: '2026-01-05' },
      { start: '2026-02-10', end: '2026-02-14' }, // +40 days
      { start: '2026-03-05', end: '2026-03-09' }, // +23 days
    ];
    expect(getPhaseForDate('2026-02-05', cycles)).toBeNull();
  });

  it('returns null when date is more than 1.5× the median past the anchor', () => {
    // daysSince = diff('2026-03-15', '2026-01-01') = 73 > 1.5 * 28 = 42
    expect(getPhaseForDate('2026-03-15', baseCycles)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getNextPeriodDate  (requires fake system clock)
// ---------------------------------------------------------------------------

describe('getNextPeriodDate', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null when there are no cycles', () => {
    expect(getNextPeriodDate([])).toBeNull();
  });

  it('predicts the next period from a single cycle', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0)); // Jan 15
    const cycles: Cycle[] = [{ start: '2026-01-01', end: '2026-01-05' }];
    const result = getNextPeriodDate(cycles);
    expect(result).not.toBeNull();
    // anchorStart='2026-01-01', daysSince=14, cyclesPassed=0, next = 0+1 = 1 cycle
    // nextStart = Jan1 + 28 = Jan29
    expect(result!.date).toBe('2026-01-29');
    expect(result!.daysToNext).toBe(14);
  });

  it('advances the cycle count when today is past the median', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 10, 12, 0, 0)); // Feb 10
    const cycles: Cycle[] = [{ start: '2026-01-01', end: '2026-01-05' }];
    const result = getNextPeriodDate(cycles);
    expect(result).not.toBeNull();
    // daysSince = diff('2026-02-10', '2026-01-01') = 40
    // cyclesPassed = floor(40/28) = 1, nextCycleNum = 2
    // nextStart = Jan1 + 56 = Feb26
    expect(result!.date).toBe('2026-02-26');
  });
});

// ---------------------------------------------------------------------------
// getCurrentCycleDay  (requires fake system clock)
// ---------------------------------------------------------------------------

describe('getCurrentCycleDay', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null when there are no cycles', () => {
    expect(getCurrentCycleDay([])).toBeNull();
  });

  it('returns null when today is before any cycle start', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 11, 31, 12, 0, 0)); // Dec 31, 2025
    const cycles: Cycle[] = [{ start: '2026-01-01', end: '2026-01-05' }];
    expect(getCurrentCycleDay(cycles)).toBeNull();
  });

  it('returns 1 on the day the cycle starts', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 12, 0, 0)); // Jan 1
    const cycles: Cycle[] = [{ start: '2026-01-01', end: '2026-01-05' }];
    expect(getCurrentCycleDay(cycles)).toBe(1);
  });

  it('returns the correct day number mid-cycle', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 10, 12, 0, 0)); // Jan 10
    const cycles: Cycle[] = [{ start: '2026-01-01', end: '2026-01-05' }];
    // diff('2026-01-10', '2026-01-01') + 1 = 9 + 1 = 10
    expect(getCurrentCycleDay(cycles)).toBe(10);
  });

  it('uses the most recent cycle as the anchor', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 5, 12, 0, 0)); // Feb 5
    const cycles: Cycle[] = [
      { start: '2026-01-01', end: '2026-01-05' },
      { start: '2026-01-29', end: '2026-02-02' },
    ];
    // Most recent start before today = '2026-01-29'
    // diff('2026-02-05', '2026-01-29') + 1 = 7 + 1 = 8
    expect(getCurrentCycleDay(cycles)).toBe(8);
  });
});
