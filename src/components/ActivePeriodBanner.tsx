import { motion } from 'motion/react';
import { diff, ymd, nice } from '../lib/cycle-math';
import type { Cycle } from '../types';

interface ActivePeriodBannerProps {
  activeCycle: Cycle;
  onEndCycle: () => void;
}

export function ActivePeriodBanner({ activeCycle, onEndCycle }: ActivePeriodBannerProps) {
  const today = ymd(new Date());
  const dayCount = diff(today, activeCycle.start) + 1;

  return (
    <motion.button
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onEndCycle}
      className="w-full mb-8 glass rounded-2xl p-4 flex items-center justify-between border border-menstrual/30 text-left"
    >
      <div className="flex items-center gap-3">
        {/* Pulsing dot */}
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-menstrual opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-menstrual" />
        </span>
        <div>
          <p className="text-sm font-medium">Period ongoing — Day {dayCount}</p>
          <p className="text-xs text-white/40">Started {nice(activeCycle.start)}</p>
        </div>
      </div>
      <span className="text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-xl">
        End
      </span>
    </motion.button>
  );
}
