import { useState, useCallback, useMemo } from 'react';
import type { Cycle, PhaseResult, DayLogs } from '../types';
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

/** Returns true if two cycles share any overlapping days. */
function cyclesOverlap(a: Cycle, b: Cycle): boolean {
  const FAR_FUTURE = '9999-12-31';
  const aEnd = a.end ?? FAR_FUTURE;
  const bEnd = b.end ?? FAR_FUTURE;
  return a.start <= bEnd && b.start <= aEnd;
}

/**
 * Sort cycles by start date and remove any overlapping entries.
 * When two cycles overlap the one with the later start wins —
 * it is more likely to be intentional (explicitly entered or imported).
 */
function sanitizeCycles(cycles: Cycle[]): Cycle[] {
  const sorted = [...cycles].sort((a, b) => a.start.localeCompare(b.start));
  const result: Cycle[] = [];
  for (const candidate of sorted) {
    // Since we process in start-date order, the candidate always has a
    // start >= any entry already in result. Remove the overlapping entry
    // (earlier start) and add the candidate (later start wins).
    const overlapIdx = result.findIndex(existing => cyclesOverlap(existing, candidate));
    if (overlapIdx !== -1) {
      result.splice(overlapIdx, 1);
    }
    result.push(candidate);
  }
  return result;
}

function loadCycles(): Cycle[] {
  try {
    const raw: Cycle[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const clean = sanitizeCycles(raw);
    // Always persist — sanitizeCycles also sorts, so even a reorder needs saving
    saveCycles(clean);
    return clean;
  } catch {
    return [];
  }
}

function saveCycles(cycles: Cycle[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cycles));
}

export function useCycles() {
  const [cycles, setCycles] = useState<Cycle[]>(loadCycles);

  const persist = useCallback((updater: (prev: Cycle[]) => Cycle[]) => {
    setCycles(prev => {
      const clean = sanitizeCycles(updater(prev));
      saveCycles(clean);
      return clean;
    });
  }, []);

  // --- CRUD ---

  const addCycle = useCallback((start: string, end: string) => {
    persist(prev => [...prev, { start, end }]);
  }, [persist]);

  const updateCycle = useCallback((oldStart: string, newStart: string, newEnd: string) => {
    persist(prev => prev.map(c =>
      c.start === oldStart ? { start: newStart, end: newEnd } : c
    ));
  }, [persist]);

  const deleteCycle = useCallback((start: string) => {
    persist(prev => prev.filter(c => c.start !== start));
  }, [persist]);

  const clearAll = useCallback(() => {
    persist(() => []);
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

  const exportJSON = useCallback((dayLogs?: DayLogs) => {
    const data = { cycles, ...(dayLogs && Object.keys(dayLogs).length > 0 ? { dayLogs } : {}) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cycle-vault-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [cycles]);

  const exportCSV = useCallback((dayLogs: DayLogs = {}) => {
    const logDates = Object.keys(dayLogs).sort();
    const hasDayLogs = logDates.length > 0;

    // Properly escape a CSV cell value
    const esc = (v: string) =>
      v.includes(',') || v.includes('"') || v.includes('\n')
        ? '"' + v.replace(/"/g, '""') + '"'
        : v;

    let csvContent: string;
    let filename: string;

    if (hasDayLogs) {
      const header = 'Date,Period Start,Period End,Flow,Mood,Energy,Cramps,Pain Locations,Pain Severity,Affected My Day,Note';
      const rows = logDates.map(date => {
        const log = dayLogs[date];
        const cycle = cycles.find(c => c.start <= date && (!c.end || c.end >= date));
        const flow = log.flow ?? '';
        const mood = log.mood?.join('; ') ?? '';
        const energy = log.energy != null ? ['Low', 'Moderate', 'High'][log.energy - 1] : '';
        const cramps = log.cramps != null ? ['Mild', 'Moderate', 'Severe'][log.cramps - 1] : '';
        const painLocs = log.pain?.locations.join('; ') ?? '';
        const painSev = log.pain != null ? ['Mild', 'Moderate', 'Severe'][log.pain.severity - 1] : '';
        const impact = log.functionalImpact === true ? 'Yes' : log.functionalImpact === false ? 'No' : '';
        const note = log.note ? esc(log.note) : '';
        return [date, cycle?.start ?? '', cycle?.end ?? '', flow, mood, energy, cramps, painLocs, painSev, impact, note].join(',');
      });
      csvContent = [header, ...rows].join('\n');
      filename = 'cycle-vault-symptoms.csv';
    } else {
      // No symptom data logged — fall back to cycle dates only
      if (!cycles.length) return;
      const header = 'Start Date,End Date';
      const rows = cycles.map(c => `${c.start},${c.end || ''}`);
      csvContent = [header, ...rows].join('\n');
      filename = 'cycle-vault-cycles.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [cycles]);

  const importCSV = useCallback((file: File): Promise<number> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const startIdx = lines[0].toLowerCase().includes('start') ? 1 : 0;

        const parsed: Cycle[] = [];
        for (let i = startIdx; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const [start, end] = line.split(',');
          if (start && /^\d{4}-\d{2}-\d{2}$/.test(start)) {
            parsed.push({ start, end: end || null });
          }
        }

        if (parsed.length > 0) {
          let count = 0;
          persist(prev => {
            let merged = [...prev];
            for (const c of parsed) {
              // Remove any existing cycle that overlaps with the imported one
              // (imported data is treated as the source of truth)
              const hadOverlap = merged.some(existing => cyclesOverlap(existing, c));
              merged = merged.filter(existing => !cyclesOverlap(existing, c));
              if (hadOverlap || !merged.some(existing => existing.start === c.start)) {
                merged.push(c);
                count++;
              }
            }
            return merged;
          });
          resolve(count);
        } else {
          resolve(0);
        }
      };
      reader.readAsText(file);
    });
  }, [persist]);

  const importJSON = useCallback((file: File): Promise<{ cycles: number; dayLogs: DayLogs }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const raw = JSON.parse(e.target?.result as string);
          // Support both old format (Cycle[]) and new format ({ cycles, dayLogs })
          const importedCycles: Cycle[] = Array.isArray(raw) ? raw : (raw.cycles ?? []);
          const importedLogs: DayLogs = Array.isArray(raw) ? {} : (raw.dayLogs ?? {});

          let count = 0;
          if (importedCycles.length > 0) {
            persist(prev => {
              let merged = [...prev];
              for (const c of importedCycles) {
                if (!c.start || !/^\d{4}-\d{2}-\d{2}$/.test(c.start)) continue;
                const incoming: Cycle = { start: c.start, end: c.end || null };
                // Remove any existing cycle that overlaps with the imported one
                const hadOverlap = merged.some(existing => cyclesOverlap(existing, incoming));
                merged = merged.filter(existing => !cyclesOverlap(existing, incoming));
                if (hadOverlap || !merged.some(existing => existing.start === c.start)) {
                  merged.push(incoming);
                  count++;
                }
              }
              return merged;
            });
          }
          resolve({ cycles: count, dayLogs: importedLogs });
        } catch {
          resolve({ cycles: 0, dayLogs: {} });
        }
      };
      reader.readAsText(file);
    });
  }, [persist]);

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
    importJSON,
    getPhaseForDate: (dateStr: string) => getPhaseForDate(dateStr, cycles),
  };
}
