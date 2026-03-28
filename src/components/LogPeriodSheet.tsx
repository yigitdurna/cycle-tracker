import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { CalendarGrid } from './CalendarGrid';
import { ymd, nice, fromYmd } from '../lib/cycle-math';
import type { Cycle, PhaseResult } from '../types';

interface LogPeriodSheetProps {
  open: boolean;
  editingCycle: Cycle | null;
  onSave: (start: string, end: string) => void;
  onClose: () => void;
}

// Stub phase function for the log sheet calendar (no phase coloring needed)
const noPhase = (): PhaseResult | null => null;

export function LogPeriodSheet({ open, editingCycle, onSave, onClose }: LogPeriodSheetProps) {
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);

  useEffect(() => {
    if (editingCycle) {
      setStart(fromYmd(editingCycle.start));
      setEnd(editingCycle.end ? fromYmd(editingCycle.end) : null);
    } else {
      setStart(null);
      setEnd(null);
    }
  }, [editingCycle, open]);

  const handleSelectDate = (date: Date) => {
    if (!start || (start && end)) {
      // First click or reset
      setStart(date);
      setEnd(null);
    } else {
      // Second click
      if (date < start) {
        setEnd(start);
        setStart(date);
      } else {
        setEnd(date);
      }
    }
  };

  const handleSave = () => {
    if (start && end) {
      onSave(ymd(start), ymd(end));
      setStart(null);
      setEnd(null);
    }
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
                {editingCycle ? 'Edit Period' : 'Log Period'}
              </h3>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            {/* Selection display */}
            <div className="flex gap-4 mb-6">
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
            </div>

            {/* Calendar */}
            <div className="glass rounded-[2rem] p-4 mb-6">
              <CalendarGrid
                getPhaseForDate={noPhase}
                selectable
                selectedRange={[start, end]}
                onSelectDate={handleSelectDate}
              />
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={!start || !end}
              className="w-full py-4 rounded-2xl bg-white text-bg-dark font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {editingCycle ? 'Update Period' : 'Log Period'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
