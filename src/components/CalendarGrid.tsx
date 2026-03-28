import { useState, useRef } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  format,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { ymd } from '../lib/cycle-math';
import type { PhaseResult } from '../types';

interface CalendarGridProps {
  getPhaseForDate: (dateStr: string) => PhaseResult | null;
  /** Range selection mode for logging periods */
  selectable?: boolean;
  selectedRange?: [Date | null, Date | null];
  onSelectDate?: (date: Date) => void;
}

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getPhaseClass(phase: PhaseResult | null): string {
  if (!phase) return '';
  switch (phase.type) {
    case 'period':
      return phase.recorded ? 'bg-menstrual/30 text-menstrual' : 'bg-menstrual/15 text-menstrual/70';
    case 'fertile':
      return 'bg-follicular/20 text-follicular';
    case 'ovulation':
      return 'bg-ovulation/30 text-ovulation';
    case 'luteal':
      return 'bg-luteal/20 text-luteal';
    case 'follicular':
      return 'bg-follicular/10 text-follicular/70';
    default:
      return '';
  }
}

function getPhaseDot(phase: PhaseResult | null): string | null {
  if (!phase) return null;
  switch (phase.type) {
    case 'period': return 'bg-menstrual';
    case 'fertile': return 'bg-follicular';
    case 'ovulation': return 'bg-ovulation';
    case 'luteal': return 'bg-luteal';
    default: return null;
  }
}

export function CalendarGrid({ getPhaseForDate, selectable, selectedRange, onSelectDate }: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const touchStartX = useRef(0);

  const today = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let d = calStart;
  while (d <= calEnd) {
    days.push(d);
    d = addDays(d, 1);
  }

  const isInRange = (date: Date) => {
    if (!selectable || !selectedRange) return false;
    const [start, end] = selectedRange;
    if (start && end) {
      return date >= start && date <= end;
    }
    if (start) {
      return isSameDay(date, start);
    }
    return false;
  };

  return (
    <div
      onTouchStart={(e) => { touchStartX.current = e.changedTouches[0].screenX; }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].screenX - touchStartX.current;
        if (Math.abs(dx) > 50) {
          if (dx < 0) setCurrentMonth(addMonths(currentMonth, 1));
          else setCurrentMonth(subMonths(currentMonth, 1));
        }
      }}
    >
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold uppercase tracking-wider">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {DAY_HEADERS.map((h, i) => (
          <div key={i} className="text-[10px] text-white/30 font-bold">{h}</div>
        ))}
      </div>

      {/* Day Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const inMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, today);
          const dateStr = ymd(day);
          const phase = inMonth ? getPhaseForDate(dateStr) : null;
          const phaseClass = getPhaseClass(phase);
          const dot = getPhaseDot(phase);
          const inRange = isInRange(day);

          return (
            <button
              key={i}
              onClick={() => selectable && onSelectDate?.(day)}
              disabled={!selectable}
              className={cn(
                'aspect-square rounded-xl flex flex-col items-center justify-center text-sm relative transition-colors',
                !inMonth && 'opacity-20',
                inMonth && !isToday && !inRange && phaseClass,
                isToday && 'bg-white text-bg-dark font-bold',
                inRange && !isToday && 'bg-white/20 ring-1 ring-white/40',
                selectable && inMonth && 'hover:bg-white/10 cursor-pointer',
              )}
            >
              {format(day, 'd')}
              {dot && !isToday && (
                <div className={cn('absolute bottom-0.5 w-1 h-1 rounded-full', dot)} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
