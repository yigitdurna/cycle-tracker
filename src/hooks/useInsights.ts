import { useMemo } from 'react';
import type { Cycle, DayLogs, CyclePhase } from '../types';
import {
  generateInsights,
  getCycleLengthAlert,
  getPersonalizedPhaseDescription,
} from '../lib/insights';

export function useInsights(logs: DayLogs, cycles: Cycle[]) {
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

  return { insights, cycleLengthAlert, hasEnoughData, getPhaseDescription };
}
