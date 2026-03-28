import { useState, useCallback, useMemo } from 'react';
import type { Cycle, PhaseResult } from '../types';
import { phaseTypeToUI } from '../types';
import {
  ymd,
  diff,
  getPhaseForDate,
  getNextPeriodDate,
  getCurrentCycleDay,
} from '../lib/cycle-math';
import { PHASES } from '../types';

const STORAGE_KEY = 'cycle-tracker-calendar-v4';

function loadCycles(): Cycle[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveCycles(cycles: Cycle[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cycles));
}

export function useCycles() {
  const [cycles, setCycles] = useState<Cycle[]>(loadCycles);

  const persist = useCallback((next: Cycle[]) => {
    const sorted = [...next].sort((a, b) => a.start.localeCompare(b.start));
    setCycles(sorted);
    saveCycles(sorted);
  }, []);

  // --- CRUD ---

  const addCycle = useCallback((start: string, end: string) => {
    persist([...cycles, { start, end }]);
  }, [cycles, persist]);

  const updateCycle = useCallback((oldStart: string, newStart: string, newEnd: string) => {
    const updated = cycles.map(c =>
      c.start === oldStart ? { start: newStart, end: newEnd } : c
    );
    persist(updated);
  }, [cycles, persist]);

  const deleteCycle = useCallback((start: string) => {
    persist(cycles.filter(c => c.start !== start));
  }, [cycles, persist]);

  const clearAll = useCallback(() => {
    persist([]);
  }, [persist]);

  // --- Computed ---

  const todayPhase: PhaseResult | null = useMemo(() => {
    return getPhaseForDate(ymd(new Date()), cycles);
  }, [cycles]);

  const todayUIPhase = useMemo(() => {
    if (!todayPhase) return PHASES.Follicular;
    return PHASES[phaseTypeToUI(todayPhase.type)];
  }, [todayPhase]);

  const nextPeriod = useMemo(() => {
    return getNextPeriodDate(cycles);
  }, [cycles]);

  const cycleDay = useMemo(() => {
    return getCurrentCycleDay(cycles);
  }, [cycles]);

  // --- Export/Import ---

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(cycles, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cycles.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [cycles]);

  const exportCSV = useCallback(() => {
    if (!cycles.length) return;
    const headers = ['Start Date,End Date'];
    const rows = cycles.map(c => `${c.start},${c.end || ''}`);
    const csvContent = headers.concat(rows).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cycles.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [cycles]);

  const importCSV = useCallback((file: File): Promise<number> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        let count = 0;
        const startIdx = lines[0].toLowerCase().includes('start') ? 1 : 0;

        const newCycles = [...cycles];
        for (let i = startIdx; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const [start, end] = line.split(',');
          if (start && /^\d{4}-\d{2}-\d{2}$/.test(start)) {
            const exists = newCycles.some(c => c.start === start);
            if (!exists) {
              newCycles.push({ start, end: end || null });
              count++;
            }
          }
        }
        if (count > 0) {
          persist(newCycles);
        }
        resolve(count);
      };
      reader.readAsText(file);
    });
  }, [cycles, persist]);

  return {
    cycles,
    addCycle,
    updateCycle,
    deleteCycle,
    clearAll,
    todayPhase,
    todayUIPhase,
    nextPeriod,
    cycleDay,
    exportJSON,
    exportCSV,
    importCSV,
    getPhaseForDate: (dateStr: string) => getPhaseForDate(dateStr, cycles),
  };
}
