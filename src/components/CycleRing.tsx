import { motion } from 'motion/react';
import type { PhaseInfo } from '../types';

interface CycleRingProps {
  day: number;
  totalDays: number;
  phaseInfo: PhaseInfo;
}

export function CycleRing({ day, totalDays, phaseInfo }: CycleRingProps) {
  const percentage = (day / totalDays) * 100;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-72 h-72">
      {/* Background Ring */}
      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 288 288">
        <defs>
          <filter id="ring-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx="144"
          cy="144"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          className="text-white/5"
        />
        {/* Progress Ring */}
        <motion.circle
          cx="144"
          cy="144"
          r={radius}
          stroke={phaseInfo.color}
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          strokeLinecap="round"
          filter="url(#ring-glow)"
        />
      </svg>

      {/* Center Content */}
      <div className="text-center z-10">
        <motion.div
          key={day}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-serif font-bold tracking-tight"
        >
          Day {day}
        </motion.div>
        <motion.div
          key={phaseInfo.name}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          className="text-sm uppercase tracking-[0.2em] mt-1 font-medium"
        >
          {phaseInfo.name} Phase
        </motion.div>
      </div>
    </div>
  );
}
