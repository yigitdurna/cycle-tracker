import { useState, useCallback, useMemo } from 'react';
import type { DayLog, DayLogs, SymptomSnapshot } from '../types';

const STORAGE_KEY = 'cycle-tracker-daylogs-v1';
const NOTE_MAX_LENGTH = 500;

function loadLogs(): DayLogs {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveLogs(logs: DayLogs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function useDayLogs() {
  const [logs, setLogs] = useState<DayLogs>(loadLogs);

  const persist = useCallback((updater: (prev: DayLogs) => DayLogs) => {
    setLogs(prev => {
      const next = updater(prev);
      saveLogs(next);
      return next;
    });
  }, []);

  const getLog = useCallback((date: string): DayLog | undefined => {
    return logs[date];
  }, [logs]);

  const setLog = useCallback((date: string, log: DayLog) => {
    const sanitized = { ...log };
    if (sanitized.note && sanitized.note.length > NOTE_MAX_LENGTH) {
      sanitized.note = sanitized.note.slice(0, NOTE_MAX_LENGTH);
    }

    // Build a timestamped snapshot of the current symptom state
    const snapshot: SymptomSnapshot = { timestamp: new Date().toISOString() };
    if (sanitized.mood?.length) snapshot.mood = sanitized.mood;
    if (sanitized.energy) snapshot.energy = sanitized.energy;
    if (sanitized.cramps) snapshot.cramps = sanitized.cramps;
    if (sanitized.sleep) snapshot.sleep = sanitized.sleep;
    if (sanitized.flow) snapshot.flow = sanitized.flow;
    if (sanitized.pain) snapshot.pain = sanitized.pain;
    if (sanitized.functionalImpact !== undefined) snapshot.functionalImpact = sanitized.functionalImpact;
    if (sanitized.note) snapshot.note = sanitized.note;

    persist(prev => {
      const existing = prev[date];
      const history = [...(existing?.history ?? []), snapshot];
      return { ...prev, [date]: { ...sanitized, history } };
    });
  }, [persist]);

  const removeLog = useCallback((date: string) => {
    persist(prev => {
      const next = { ...prev };
      delete next[date];
      return next;
    });
  }, [persist]);

  const clearAllLogs = useCallback(() => {
    persist(() => ({}));
  }, [persist]);

  const todayLog = useMemo(() => {
    return logs[ymd(new Date())];
  }, [logs]);

  return {
    allLogs: logs,
    getLog,
    setLog,
    removeLog,
    clearAllLogs,
    todayLog,
  };
}
