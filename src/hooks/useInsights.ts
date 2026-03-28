import { useMemo } from 'react';
import type { Cycle, DayLog, DayLogs, CyclePhase } from '../types';
import {
  generateInsights,
  getCycleLengthAlert,
  getPersonalizedPhaseDescription,
  getTodayInsights,
  getPhaseForDay,
} from '../lib/insights';

export function useInsights(logs: DayLogs, cycles: Cycle[], todayLog?: DayLog) {
  const insights = useMemo(
    () => generateInsights(logs, cycles),
    [logs, cycles],
  );

  const cycleLengthAlert = useMemo(
    () => getCycleLengthAlert(cycles),
    [cycles],
  );

  const hasEnoughData = cycles.length >= 2;

  const getPhaseDescription = useMemo(() => {
    return (phase: CyclePhase) => getPersonalizedPhaseDescription(logs, cycles, phase);
  }, [logs, cycles]);

  const todayInsights = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const phase = getPhaseForDay(today, cycles) ?? 'Follicular';
    return getTodayInsights(todayLog, logs, cycles, phase);
  }, [logs, cycles, todayLog]);

  return { insights, cycleLengthAlert, hasEnoughData, getPhaseDescription, todayInsights };
}
