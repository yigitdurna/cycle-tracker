import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { CalendarGrid } from './CalendarGrid';
import { ymd, nice, fromYmd } from '../lib/cycle-math';
import { cn } from '../lib/utils';
import type { Cycle, PhaseResult } from '../types';

type SheetMode = 'start' | 'end' | 'log' | 'edit';

interface LogPeriodSheetProps {
  open: boolean;
  editingCycle: Cycle | null;
  activeCycle: Cycle | null;
  onSave: (start: string, end: string | null) => void;
  onEndCycle: (end: string) => void;
  onClose: () => void;
}

// Stub phase function for the log sheet calendar (no phase coloring needed)
const noPhase = (): PhaseResult | null => null;

const TITLES: Record<SheetMode, string> = {
  start: 'Start Cycle',
  end: 'End Cycle',
  log: 'Log Period',
  edit: 'Edit Period',
};

const SAVE_LABELS: Record<SheetMode, string> = {
  start: 'Start Cycle',
  end: 'End Cycle',
  log: 'Log Period',
  edit: 'Update Period',
};

export function LogPeriodSheet({ open, editingCycle, activeCycle, onSave, onEndCycle, onClose }: LogPeriodSheetProps) {
  const [mode, setMode] = useState<SheetMode>('start');
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);

  useEffect(() => {
    if (open) {
      const nextMode: SheetMode = editingCycle ? 'edit' : activeCycle ? 'end' : 'start';
      setMode(nextMode);
      if (editingCycle) {
        setStart(fromYmd(editingCycle.start));
        setEnd(editingCycle.end ? fromYmd(editingCycle.end) : null);
      } else {
        setStart(null);
        setEnd(null);
      }
    }
  }, [editingCycle, activeCycle, open]);

  const todayStr = ymd(new Date());

  const handleSelectDate = (date: Date) => {
    if (mode === 'start') {
      setStart(date);
      setEnd(null);
    } else if (mode === 'end') {
      // Constrain to >= activeCycle start and <= today
      const dateStr = ymd(date);
      if (activeCycle && dateStr >= activeCycle.start && dateStr <= todayStr) {
        setStart(date);
      }
    } else {
      // log/edit mode — existing two-date behavior
      if (!start || (start && end)) {
        setStart(date);
        setEnd(null);
      } else {
        if (date < start) {
          setEnd(start);
          setStart(date);
        } else {
          setEnd(date);
        }
      }
    }
  };

  const handleSave = () => {
    if (mode === 'start' && start) {
      onSave(ymd(start), null);
    } else if (mode === 'end' && start) {
      onEndCycle(ymd(start));
    } else if ((mode === 'log' || mode === 'edit') && start && end) {
      onSave(ymd(start), ymd(end));
    }
  };

  const canSave =
    (mode === 'start' && !!start) ||
    (mode === 'end' && !!start) ||
    ((mode === 'log' || mode === 'edit') && !!start && !!end);

  // Build selectedRange for CalendarGrid
  const selectedRange: [Date | null, Date | null] = (() => {
    if (mode === 'start') return [start, null];
    if (mode === 'end') return [activeCycle ? fromYmd(activeCycle.start) : null, start];
    return [start, end];
  })();

  const switchMode = (next: SheetMode) => {
    setMode(next);
    setStart(null);
    setEnd(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center"
        >
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-lg bg-bg-dark border-t border-white/10 rounded-t-[2rem] p-6 pb-10 max-h-[85vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />

            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif font-bold">
                {TITLES[mode]}
              </h3>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            {/* Mode tabs — only show when not editing */}
            {!editingCycle && (
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => switchMode('start')}
                  disabled={!!activeCycle}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all',
                    mode === 'start'
                      ? 'bg-white/15 text-white'
                      : 'bg-white/5 text-white/40',
                    activeCycle && 'opacity-30 cursor-not-allowed'
                  )}
                >
                  Start Cycle
                </button>
                {activeCycle && (
                  <button
                    onClick={() => switchMode('end')}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all',
                      mode === 'end'
                        ? 'bg-white/15 text-white'
                        : 'bg-white/5 text-white/40'
                    )}
                  >
                    End Cycle
                  </button>
                )}
                <button
                  onClick={() => switchMode('log')}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all',
                    mode === 'log'
                      ? 'bg-white/15 text-white'
                      : 'bg-white/5 text-white/40'
                  )}
                >
                  Log Period
                </button>
              </div>
            )}

            {/* Selection display */}
            <div className="flex gap-4 mb-6">
              {mode === 'start' && (
                <div className="flex-1 glass rounded-2xl p-3 text-center">
                  <div className="text-[10px] text-white/40 uppercase tracking-wider">Start</div>
                  <div className="text-sm font-medium mt-1">
                    {start ? nice(ymd(start)) : '—'}
                  </div>
                </div>
              )}

              {mode === 'end' && activeCycle && (
                <>
                  <div className="flex-1 glass rounded-2xl p-3 text-center">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider">Started</div>
                    <div className="text-sm font-medium mt-1">{nice(activeCycle.start)}</div>
                  </div>
                  <div className="flex-1 glass rounded-2xl p-3 text-center">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider">End</div>
                    <div className="text-sm font-medium mt-1">
                      {start ? nice(ymd(start)) : '—'}
                    </div>
                  </div>
                </>
              )}

              {(mode === 'log' || mode === 'edit') && (
                <>
                  <div className="flex-1 glass rounded-2xl p-3 text-center">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider">Start</div>
                    <div className="text-sm font-medium mt-1">
                      {start ? nice(ymd(start)) : '—'}
                    </div>
                  </div>
                  <div className="flex-1 glass rounded-2xl p-3 text-center">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider">End</div>
                    <div className="text-sm font-medium mt-1">
                      {end ? nice(ymd(end)) : '—'}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Calendar */}
            <div className="glass rounded-[2rem] p-4 mb-6">
              <CalendarGrid
                getPhaseForDate={noPhase}
                selectable
                selectedRange={selectedRange}
                onSelectDate={handleSelectDate}
              />
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="w-full py-4 rounded-2xl bg-white text-bg-dark font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {SAVE_LABELS[mode]}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
