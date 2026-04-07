// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCycles } from '../useCycles';

const STORAGE_KEY = 'cycle-tracker-calendar-v4';

// Node 25's native localStorage lacks clear/getItem/setItem when
// --localstorage-file is not set. Replace it with a simple in-memory shim
// so the hook (and tests) can use the standard Web Storage API.
const store: Record<string, string> = {};
const storageMock: Storage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { for (const k of Object.keys(store)) delete store[k]; },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};
Object.defineProperty(globalThis, 'localStorage', { value: storageMock, writable: true });

beforeEach(() => {
  localStorage.clear();
});

describe('activeCycle', () => {
  it('returns null when no cycles exist', () => {
    const { result } = renderHook(() => useCycles());
    expect(result.current.activeCycle).toBeNull();
  });

  it('returns null when all cycles have end dates', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { start: '2026-03-01', end: '2026-03-05' },
    ]));
    const { result } = renderHook(() => useCycles());
    expect(result.current.activeCycle).toBeNull();
  });

  it('returns the cycle with null end', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { start: '2026-03-01', end: '2026-03-05' },
      { start: '2026-04-01', end: null },
    ]));
    const { result } = renderHook(() => useCycles());
    expect(result.current.activeCycle).toEqual({ start: '2026-04-01', end: null });
  });
});
