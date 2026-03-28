import type { Cycle, CyclePhase, DayLogs, PhaseSymptomPattern, CycleLengthAlert, Insight } from '../types';
import { getPhaseForDate, diff } from './cycle-math';
import { phaseTypeToUI } from '../types';

/**
 * Returns the UI phase name for a date, or null if unknown.
 * Thin wrapper around getPhaseForDate + phaseTypeToUI.
 */
export function getPhaseForDay(dateStr: string, cycles: Cycle[]): CyclePhase | null {
  const result = getPhaseForDate(dateStr, cycles);
  if (!result || result.type === 'future') return null;
  return phaseTypeToUI(result.type);
}

// Symptoms we track as present/absent with optional severity
const TRACKED_SYMPTOMS = ['cramps', 'energy', 'sleep', 'flow', 'mood', 'pain'] as const;

/**
 * Analyze which symptoms appear in which phases, across all logged days.
 * Returns patterns sorted by frequency (highest first).
 * Requires >= 2 cycles to produce results.
 */
export function getPhaseSymptomPatterns(
  logs: DayLogs,
  cycles: Cycle[],
): PhaseSymptomPattern[] {
  if (cycles.length < 2) return [];

  const dates = Object.keys(logs);
  if (dates.length === 0) return [];

  // Count: { "cramps|Menstrual": { occurrences, totalLogged, severitySum } }
  const counts = new Map<string, { occurrences: number; totalLogged: number; severitySum: number }>();

  for (const dateStr of dates) {
    const log = logs[dateStr];
    const phase = getPhaseForDay(dateStr, cycles);
    if (!phase) continue;

    for (const symptom of TRACKED_SYMPTOMS) {
      const key = `${symptom}|${phase}`;
      if (!counts.has(key)) {
        counts.set(key, { occurrences: 0, totalLogged: 0, severitySum: 0 });
      }
      const entry = counts.get(key)!;
      entry.totalLogged++;

      const value = log[symptom as keyof typeof log];
      if (value !== undefined && value !== null) {
        // mood is an array, pain is an object — check non-empty
        if (Array.isArray(value) ? value.length > 0 : true) {
          entry.occurrences++;
          if (typeof value === 'number') {
            entry.severitySum += value;
          }
        }
      }
    }
  }

  const patterns: PhaseSymptomPattern[] = [];

  for (const [key, data] of counts) {
    if (data.occurrences === 0) continue;
    const [symptom, phase] = key.split('|') as [string, CyclePhase];
    patterns.push({
      symptom,
      phase,
      occurrences: data.occurrences,
      totalDaysInPhase: data.totalLogged,
      frequency: data.occurrences / data.totalLogged,
      avgSeverity: data.severitySum > 0 ? data.severitySum / data.occurrences : undefined,
    });
  }

  return patterns.sort((a, b) => b.frequency - a.frequency);
}

const DEVIATION_THRESHOLD = 3; // days

/**
 * Check if the most recent completed cycle length deviates
 * significantly from the user's median. Requires >= 3 cycles
 * (need at least 2 lengths to compute a median, then 1 to compare).
 */
export function getCycleLengthAlert(cycles: Cycle[]): CycleLengthAlert | null {
  if (cycles.length < 3) return null;

  const sorted = [...cycles].sort((a, b) => a.start.localeCompare(b.start));
  const starts = sorted.map(c => c.start);

  const lengths: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    lengths.push(diff(starts[i], starts[i - 1]));
  }

  if (lengths.length < 2) return null;

  // Median of all lengths except the most recent
  const historicalLengths = lengths.slice(0, -1);
  const sortedH = [...historicalLengths].sort((a, b) => a - b);
  const mid = Math.floor(sortedH.length / 2);
  const median = sortedH.length % 2
    ? sortedH[mid]
    : (sortedH[mid - 1] + sortedH[mid]) / 2;

  const currentLength = lengths[lengths.length - 1];
  const deviation = currentLength - Math.round(median);

  if (Math.abs(deviation) <= DEVIATION_THRESHOLD) return null;

  const direction = deviation > 0 ? 'longer' : 'shorter';
  return {
    currentLength,
    medianLength: Math.round(median),
    deviation,
    message: `Your last cycle was ${Math.abs(deviation)} days ${direction} than usual (${currentLength} vs ${Math.round(median)} days).`,
  };
}

const SYMPTOM_LABELS: Record<string, string> = {
  cramps: 'cramps',
  energy: 'energy changes',
  mood: 'mood shifts',
  pain: 'pain',
  flow: 'flow changes',
  sleep: 'sleep changes',
};

const SEVERITY_WORDS: Record<number, string> = {
  1: 'mild',
  2: 'moderate',
  3: 'strong',
};

/**
 * Generate a 1-2 sentence description for a phase based on the user's data.
 * Returns null if insufficient data (< 2 cycles or no logs in this phase).
 */
export function getPersonalizedPhaseDescription(
  logs: DayLogs,
  cycles: Cycle[],
  phase: CyclePhase,
): string | null {
  if (cycles.length < 2) return null;

  const patterns = getPhaseSymptomPatterns(logs, cycles);
  const phasePatterns = patterns
    .filter(p => p.phase === phase && p.frequency >= 0.4)
    .slice(0, 3);

  if (phasePatterns.length === 0) return null;

  const parts: string[] = [];

  for (const p of phasePatterns) {
    const pct = Math.round(p.frequency * 100);
    const label = SYMPTOM_LABELS[p.symptom] || p.symptom;

    if (p.avgSeverity !== undefined) {
      const severity = SEVERITY_WORDS[Math.round(p.avgSeverity)] || 'moderate';
      parts.push(`${severity} ${label} (${pct}% of the time)`);
    } else {
      parts.push(`${label} (${pct}% of the time)`);
    }
  }

  if (parts.length === 1) {
    return `Based on your history, you tend to experience ${parts[0]} during this phase.`;
  }

  const last = parts.pop();
  return `Based on your history, you tend to experience ${parts.join(', ')} and ${last} during this phase.`;
}

const MAX_INSIGHTS = 4;
const MIN_FREQUENCY_FOR_INSIGHT = 0.4;

/**
 * Generate all insights from cycles + logs.
 * Returns up to 4 insights, sorted by confidence.
 * Requires >= 2 cycles.
 */
export function generateInsights(
  logs: DayLogs,
  cycles: Cycle[],
): Insight[] {
  if (cycles.length < 2) return [];

  const insights: Insight[] = [];
  let idCounter = 0;

  // 1. Phase-symptom patterns → pattern insights
  const patterns = getPhaseSymptomPatterns(logs, cycles);
  const seen = new Set<string>();

  for (const p of patterns) {
    if (seen.has(p.symptom)) continue;
    if (p.frequency < MIN_FREQUENCY_FOR_INSIGHT) continue;
    seen.add(p.symptom);

    const pct = Math.round(p.frequency * 100);
    const label = SYMPTOM_LABELS[p.symptom] || p.symptom;
    const severityText = p.avgSeverity
      ? ` (avg ${SEVERITY_WORDS[Math.round(p.avgSeverity)] || 'moderate'})`
      : '';

    insights.push({
      id: `pattern-${idCounter++}`,
      category: 'pattern',
      title: `${capitalize(label)} in ${p.phase}`,
      description: `You experience ${label}${severityText} in ${pct}% of your ${p.phase.toLowerCase()} days.`,
      phase: p.phase,
      confidence: p.frequency,
    });
  }

  // 2. Cycle length alert → cycle-length insight
  const alert = getCycleLengthAlert(cycles);
  if (alert) {
    insights.push({
      id: `cycle-len-${idCounter++}`,
      category: 'cycle-length',
      title: 'Cycle length changed',
      description: alert.message,
      confidence: Math.min(1, 0.5 + Math.abs(alert.deviation) / 20),
    });
  }

  insights.sort((a, b) => b.confidence - a.confidence);
  return insights.slice(0, MAX_INSIGHTS);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
