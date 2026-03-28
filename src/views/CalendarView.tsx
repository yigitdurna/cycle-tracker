import { useState } from 'react';
import { motion } from 'motion/react';
import { Droplets } from 'lucide-react';
import { CalendarGrid } from '../components/CalendarGrid';
import { DayDetailSheet } from '../components/DayDetailSheet';
import type { Cycle, PhaseResult, DayLog, DayLogs } from '../types';
import { PHASES, phaseTypeToUI } from '../types';
import { getNextPeriodDate } from '../lib/cycle-math';

interface CalendarViewProps {
  cycles: Cycle[];
  getPhaseForDate: (dateStr: string) => PhaseResult | null;
  dayLogs?: DayLogs;
  onUpdateLog?: (date: string, log: Partial<DayLog>) => void;
}

export function CalendarView({ cycles, getPhaseForDate, dayLogs, onUpdateLog }: CalendarViewProps) {
  const nextPeriod = getNextPeriodDate(cycles);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleDayTap = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  const selectedPhase = selectedDate ? getPhaseForDate(selectedDate) : null;
  const selectedUIPhase = selectedPhase ? PHASES[phaseTypeToUI(selectedPhase.type)] : PHASES.Follicular;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <h2 className="text-3xl font-serif font-bold">Calendar</h2>
      <div className="glass rounded-[2rem] p-6">
        <CalendarGrid
          getPhaseForDate={getPhaseForDate}
          dayLogs={dayLogs}
          onDayTap={handleDayTap}
        />
      </div>

      {/* Legend */}
      <div className="glass rounded-3xl p-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-menstrual" />
          <span className="text-xs text-white/50">Period</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-follicular" />
          <span className="text-xs text-white/50">Fertile</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-ovulation" />
          <span className="text-xs text-white/50">Ovulation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-luteal" />
          <span className="text-xs text-white/50">Luteal</span>
        </div>
      </div>

      {/* Upcoming */}
      {cycles.length > 0 && (
        <div className="glass rounded-3xl p-6 space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white/40">Upcoming</h4>
          {nextPeriod && (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-menstrual/20 flex items-center justify-center">
                <Droplets size={18} className="text-menstrual" />
              </div>
              <div>
                <p className="font-medium">Next Period</p>
                <p className="text-xs text-white/40">In {nextPeriod.daysToNext} {nextPeriod.daysToNext === 1 ? 'day' : 'days'}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Day Detail Sheet */}
      <DayDetailSheet
        open={!!selectedDate}
        date={selectedDate || ''}
        log={selectedDate && dayLogs ? dayLogs[selectedDate] : undefined}
        phaseName={selectedUIPhase.name}
        phaseColor={selectedUIPhase.color}
        onClose={() => setSelectedDate(null)}
        onUpdateLog={onUpdateLog || (() => {})}
      />
    </motion.div>
  );
}
