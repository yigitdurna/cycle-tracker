import { describe, it, expect } from 'vitest';
import type { Insight, PhaseSymptomPattern, CycleLengthAlert, Cycle, DayLogs } from '../../types';
import { getPhaseForDay, getPhaseSymptomPatterns, getCycleLengthAlert, getPersonalizedPhaseDescription, generateInsights, getTodayInsights } from '../insights';

describe('Insight types', () => {
  it('Insight type has required shape', () => {
    const insight: Insight = {
      id: 'test-1',
      category: 'pattern',
      title: 'Test insight',
      description: 'Description here',
      confidence: 0.7,
    };
    expect(insight.id).toBe('test-1');
    expect(insight.category).toBe('pattern');
    expect(insight.confidence).toBe(0.7);
  });

  it('PhaseSymptomPattern has required shape', () => {
    const pattern: PhaseSymptomPattern = {
      symptom: 'cramps',
      phase: 'Menstrual',
      occurrences: 4,
      totalDaysInPhase: 5,
      frequency: 0.8,
    };
    expect(pattern.frequency).toBe(0.8);
  });

  it('CycleLengthAlert has required shape', () => {
    const alert: CycleLengthAlert = {
      currentLength: 38,
      medianLength: 28,
      deviation: 10,
      message: 'This cycle was 10 days longer than usual.',
    };
    expect(alert.deviation).toBe(10);
  });
});

describe('getPhaseForDay', () => {
  const cycles: Cycle[] = [
    { start: '2026-01-01', end: '2026-01-05' },
    { start: '2026-01-29', end: '2026-02-02' },
  ];

  it('returns Menstrual for a recorded period day', () => {
    expect(getPhaseForDay('2026-01-03', cycles)).toBe('Menstrual');
  });

  it('returns Luteal for a late-cycle day', () => {
    expect(getPhaseForDay('2026-01-22', cycles)).toBe('Luteal');
  });

  it('returns null when no cycles exist', () => {
    expect(getPhaseForDay('2026-01-03', [])).toBeNull();
  });

  it('returns null when date is way before any cycle', () => {
    expect(getPhaseForDay('2020-01-01', cycles)).toBeNull();
  });
});

describe('getPhaseSymptomPatterns', () => {
  const cycles: Cycle[] = [
    { start: '2026-01-01', end: '2026-01-05' },
    { start: '2026-01-29', end: '2026-02-02' },
    { start: '2026-02-26', end: '2026-03-02' },
  ];

  it('returns empty array when no logs exist', () => {
    expect(getPhaseSymptomPatterns({}, cycles)).toEqual([]);
  });

  it('returns empty array when fewer than 2 cycles', () => {
    expect(getPhaseSymptomPatterns({}, [cycles[0]])).toEqual([]);
  });

  it('detects cramps pattern in menstrual phase', () => {
    const logs: DayLogs = {
      '2026-01-01': { date: '2026-01-01', cramps: 2 },
      '2026-01-02': { date: '2026-01-02', cramps: 3 },
      '2026-01-04': { date: '2026-01-04', cramps: 1 },
      '2026-01-29': { date: '2026-01-29', cramps: 2 },
      '2026-01-30': { date: '2026-01-30', cramps: 1 },
      '2026-02-26': { date: '2026-02-26', cramps: 3 },
      '2026-02-27': { date: '2026-02-27', cramps: 2 },
      '2026-02-28': { date: '2026-02-28', cramps: 1 },
    };

    const patterns = getPhaseSymptomPatterns(logs, cycles);
    const crampsInMenstrual = patterns.find(
      p => p.symptom === 'cramps' && p.phase === 'Menstrual'
    );

    expect(crampsInMenstrual).toBeDefined();
    expect(crampsInMenstrual!.occurrences).toBe(8);
    expect(crampsInMenstrual!.avgSeverity).toBeCloseTo(1.875);
  });

  it('detects mood pattern with frequency', () => {
    const logs: DayLogs = {
      '2026-01-20': { date: '2026-01-20', mood: ['irritable'] },
      '2026-01-22': { date: '2026-01-22', mood: ['anxious', 'irritable'] },
      '2026-01-25': { date: '2026-01-25', mood: ['sad'] },
    };

    const patterns = getPhaseSymptomPatterns(logs, cycles);
    const moodInLuteal = patterns.find(
      p => p.symptom === 'mood' && p.phase === 'Luteal'
    );

    expect(moodInLuteal).toBeDefined();
    expect(moodInLuteal!.occurrences).toBe(3);
  });
});

describe('getCycleLengthAlert', () => {
  it('returns null when fewer than 4 cycles (2 cycles)', () => {
    const cycles: Cycle[] = [
      { start: '2026-01-01', end: '2026-01-05' },
      { start: '2026-01-29', end: '2026-02-02' },
    ];
    expect(getCycleLengthAlert(cycles)).toBeNull();
  });

  it('returns null when exactly 3 cycles (requires >= 4)', () => {
    const cycles: Cycle[] = [
      { start: '2026-01-01', end: '2026-01-05' },
      { start: '2026-01-29', end: '2026-02-02' },
      { start: '2026-02-26', end: '2026-03-02' },
    ];
    expect(getCycleLengthAlert(cycles)).toBeNull();
  });

  it('returns null when deviation is exactly 3 days (threshold is > 3)', () => {
    // lengths = [28, 28, 31]: historical median = 28, current = 31, deviation = +3
    const cycles: Cycle[] = [
      { start: '2026-01-01', end: '2026-01-05' },
      { start: '2026-01-29', end: '2026-02-02' }, // +28
      { start: '2026-02-26', end: '2026-03-02' }, // +28
      { start: '2026-03-29', end: '2026-04-02' }, // +31
    ];
    expect(getCycleLengthAlert(cycles)).toBeNull();
  });

  it('returns alert when deviation is exactly 4 days (just past threshold)', () => {
    // lengths = [28, 28, 32]: historical median = 28, current = 32, deviation = +4
    const cycles: Cycle[] = [
      { start: '2026-01-01', end: '2026-01-05' },
      { start: '2026-01-29', end: '2026-02-02' }, // +28
      { start: '2026-02-26', end: '2026-03-02' }, // +28
      { start: '2026-03-30', end: '2026-04-03' }, // +32
    ];
    const alert = getCycleLengthAlert(cycles);
    expect(alert).not.toBeNull();
    expect(alert!.deviation).toBe(4);
  });

  it('returns null when cycle length is within ±3 days of median', () => {
    const cycles: Cycle[] = [
      { start: '2026-01-01', end: '2026-01-05' },
      { start: '2026-01-29', end: '2026-02-02' },
      { start: '2026-02-26', end: '2026-03-02' },
      { start: '2026-03-27', end: '2026-03-31' },
    ];
    expect(getCycleLengthAlert(cycles)).toBeNull();
  });

  it('returns alert when most recent cycle is significantly longer', () => {
    const cycles: Cycle[] = [
      { start: '2026-01-01', end: '2026-01-05' },
      { start: '2026-01-29', end: '2026-02-02' },
      { start: '2026-02-26', end: '2026-03-02' },
      { start: '2026-04-05', end: '2026-04-09' },
    ];
    const alert = getCycleLengthAlert(cycles);
    expect(alert).not.toBeNull();
    expect(alert!.currentLength).toBe(38);
    expect(alert!.medianLength).toBe(28);
    expect(alert!.deviation).toBe(10);
  });

  it('returns alert when most recent cycle is significantly shorter', () => {
    const cycles: Cycle[] = [
      { start: '2026-01-01', end: '2026-01-05' },
      { start: '2026-01-29', end: '2026-02-02' },
      { start: '2026-02-26', end: '2026-03-02' },
      { start: '2026-03-17', end: '2026-03-21' },
    ];
    const alert = getCycleLengthAlert(cycles);
    expect(alert).not.toBeNull();
    expect(alert!.deviation).toBe(-9);
  });
});

describe('getPersonalizedPhaseDescription', () => {
  const cycles: Cycle[] = [
    { start: '2026-01-01', end: '2026-01-05' },
    { start: '2026-01-29', end: '2026-02-02' },
    { start: '2026-02-26', end: '2026-03-02' },
  ];

  it('returns null when no symptom data exists', () => {
    expect(getPersonalizedPhaseDescription({}, cycles, 'Menstrual')).toBeNull();
  });

  it('returns null when fewer than 2 cycles', () => {
    expect(getPersonalizedPhaseDescription({}, [cycles[0]], 'Menstrual')).toBeNull();
  });

  it('generates description mentioning cramps when common in menstrual', () => {
    const logs: DayLogs = {
      '2026-01-01': { date: '2026-01-01', cramps: 3 },
      '2026-01-02': { date: '2026-01-02', cramps: 2 },
      '2026-01-29': { date: '2026-01-29', cramps: 2 },
      '2026-02-26': { date: '2026-02-26', cramps: 3 },
    };
    const desc = getPersonalizedPhaseDescription(logs, cycles, 'Menstrual');
    expect(desc).not.toBeNull();
    expect(desc!.toLowerCase()).toContain('cramp');
  });

  it('generates description mentioning energy when logged in follicular', () => {
    const logs: DayLogs = {
      '2026-01-06': { date: '2026-01-06', energy: 3 },
      '2026-01-07': { date: '2026-01-07', energy: 3 },
      '2026-01-08': { date: '2026-01-08', energy: 2 },
    };
    const desc = getPersonalizedPhaseDescription(logs, cycles, 'Follicular');
    expect(desc).not.toBeNull();
    expect(desc!.toLowerCase()).toContain('energy');
  });
});

describe('generateInsights', () => {
  const cycles: Cycle[] = [
    { start: '2026-01-01', end: '2026-01-05' },
    { start: '2026-01-29', end: '2026-02-02' },
    { start: '2026-02-26', end: '2026-03-02' },
  ];

  it('returns empty array when fewer than 2 cycles', () => {
    expect(generateInsights({}, [cycles[0]])).toEqual([]);
  });

  it('returns pattern insights when symptom data exists', () => {
    const logs: DayLogs = {
      '2026-01-01': { date: '2026-01-01', cramps: 3 },
      '2026-01-02': { date: '2026-01-02', cramps: 2 },
      '2026-01-29': { date: '2026-01-29', cramps: 2 },
      '2026-02-26': { date: '2026-02-26', cramps: 3 },
    };
    const insights = generateInsights(logs, cycles);
    expect(insights.length).toBeGreaterThan(0);
    expect(insights.some(i => i.category === 'pattern')).toBe(true);
  });

  it('returns cycle-length insight when latest cycle is irregular', () => {
    const irregularCycles: Cycle[] = [
      ...cycles,
      { start: '2026-04-05', end: '2026-04-09' },
    ];
    const insights = generateInsights({}, irregularCycles);
    expect(insights.some(i => i.category === 'cycle-length')).toBe(true);
  });

  it('limits to max 4 insights', () => {
    const logs: DayLogs = {};
    for (let d = 1; d <= 28; d++) {
      const day = String(d).padStart(2, '0');
      logs[`2026-01-${day}`] = {
        date: `2026-01-${day}`,
        cramps: ((d % 3) + 1) as 1 | 2 | 3,
        energy: ((d % 3) + 1) as 1 | 2 | 3,
        mood: ['anxious', 'sad'],
        flow: 'medium',
      };
      logs[`2026-02-${day}`] = {
        date: `2026-02-${day}`,
        cramps: ((d % 3) + 1) as 1 | 2 | 3,
        energy: ((d % 3) + 1) as 1 | 2 | 3,
        mood: ['irritable'],
      };
    }
    const insights = generateInsights(logs, cycles);
    expect(insights.length).toBeLessThanOrEqual(4);
  });

  it('sorts by confidence descending', () => {
    const logs: DayLogs = {
      '2026-01-01': { date: '2026-01-01', cramps: 3, energy: 1 },
      '2026-01-02': { date: '2026-01-02', cramps: 2 },
      '2026-01-29': { date: '2026-01-29', cramps: 2, energy: 1 },
      '2026-02-26': { date: '2026-02-26', cramps: 3 },
    };
    const insights = generateInsights(logs, cycles);
    for (let i = 1; i < insights.length; i++) {
      expect(insights[i].confidence).toBeLessThanOrEqual(insights[i - 1].confidence);
    }
  });
});

// ---------------------------------------------------------------------------
// getTodayInsights
// ---------------------------------------------------------------------------

describe('getTodayInsights', () => {
  const cycles: Cycle[] = [
    { start: '2026-01-01', end: '2026-01-05' },
    { start: '2026-01-29', end: '2026-02-02' },
    { start: '2026-02-26', end: '2026-03-02' },
  ];

  it('always includes the phase tip as the first insight', () => {
    const insights = getTodayInsights(undefined, {}, [], 'Follicular');
    expect(insights.length).toBeGreaterThanOrEqual(1);
    expect(insights[0].id).toBe('today-phase-tip');
    expect(insights[0].category).toBe('prediction');
  });

  it('returns only the phase tip when fewer than 2 cycles', () => {
    const insights = getTodayInsights(undefined, {}, [cycles[0]], 'Follicular');
    expect(insights.length).toBe(1);
    expect(insights[0].id).toBe('today-phase-tip');
  });

  it('adds a heads-up card when a symptom appears in >= 50% of phase days', () => {
    // 8 menstrual days logged, cramps present on 6 → frequency = 0.75 >= 0.5
    const logs: DayLogs = {
      '2026-01-01': { date: '2026-01-01', cramps: 2 },
      '2026-01-02': { date: '2026-01-02', cramps: 1 },
      '2026-01-03': { date: '2026-01-03', cramps: 3 },
      '2026-01-04': { date: '2026-01-04' },           // no cramps
      '2026-01-29': { date: '2026-01-29', cramps: 2 },
      '2026-01-30': { date: '2026-01-30', cramps: 1 },
      '2026-01-31': { date: '2026-01-31', cramps: 2 },
      '2026-02-01': { date: '2026-02-01' },           // no cramps
    };
    const insights = getTodayInsights(undefined, logs, cycles, 'Menstrual');
    expect(insights.some(i => i.id === 'today-heads-up')).toBe(true);
  });

  it('does not add a heads-up card when no symptom reaches 50% frequency', () => {
    // 4 logged menstrual days, cramps on only 1 → frequency = 0.25 < 0.5
    const logs: DayLogs = {
      '2026-01-01': { date: '2026-01-01', cramps: 2 },
      '2026-01-02': { date: '2026-01-02' },
      '2026-01-03': { date: '2026-01-03' },
      '2026-01-04': { date: '2026-01-04' },
    };
    const insights = getTodayInsights(undefined, logs, cycles, 'Menstrual');
    expect(insights.some(i => i.id === 'today-heads-up')).toBe(false);
  });

  it('adds an anomaly card when todayLog contains a historically rare symptom', () => {
    // 5 logged menstrual days, energy on only 1 → frequency = 0.2 < 0.25
    // totalDaysInPhase = 5 >= 3 → anomaly threshold met
    const logs: DayLogs = {
      '2026-01-01': { date: '2026-01-01', energy: 2 }, // has energy
      '2026-01-02': { date: '2026-01-02' },
      '2026-01-03': { date: '2026-01-03' },
      '2026-01-04': { date: '2026-01-04' },
      '2026-01-05': { date: '2026-01-05' },
    };
    // Today: user logs energy in Menstrual — historically rare for them
    const todayLog = { date: '2026-01-29', energy: 1 as const };
    const insights = getTodayInsights(todayLog, logs, cycles, 'Menstrual');
    expect(insights.some(i => i.id === 'today-unusual')).toBe(true);
  });

  it('does not add an anomaly card when no todayLog is provided', () => {
    const logs: DayLogs = {
      '2026-01-01': { date: '2026-01-01', energy: 2 },
      '2026-01-02': { date: '2026-01-02' },
      '2026-01-03': { date: '2026-01-03' },
      '2026-01-04': { date: '2026-01-04' },
      '2026-01-05': { date: '2026-01-05' },
    };
    const insights = getTodayInsights(undefined, logs, cycles, 'Menstrual');
    expect(insights.some(i => i.id === 'today-unusual')).toBe(false);
  });
});
