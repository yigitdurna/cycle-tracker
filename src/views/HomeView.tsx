import { motion } from 'motion/react';
import { Calendar as CalendarIcon, Droplets } from 'lucide-react';
import { CycleRing } from '../components/CycleRing';
import { StatCard } from '../components/StatCard';
import { PhaseCard } from '../components/PhaseCard';
import type { PhaseInfo, PhaseResult } from '../types';
import { getCycleStats } from '../lib/cycle-math';
import type { Cycle } from '../types';

interface HomeViewProps {
  todayPhase: PhaseResult | null;
  todayUIPhase: PhaseInfo;
  nextPeriod: { date: string; daysToNext: number } | null;
  cycleDay: number | null;
  cycles: Cycle[];
}

export function HomeView({ todayPhase, todayUIPhase, nextPeriod, cycleDay, cycles }: HomeViewProps) {
  const stats = getCycleStats(cycles);
  const totalDays = stats?.med ?? 28;
  const displayDay = cycleDay ?? 1;

  let phaseSubtitle: string | undefined;
  if (todayPhase) {
    if (todayPhase.type === 'period') {
      phaseSubtitle = `Day ${todayPhase.day} of your period`;
    }
  }

  const hasCycles = cycles.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center"
    >
      <CycleRing day={displayDay} totalDays={totalDays} phaseInfo={todayUIPhase} />

      <div className="w-full flex gap-4 mt-12">
        <StatCard
          label="Next Period"
          value={hasCycles && nextPeriod ? `${nextPeriod.daysToNext} ${nextPeriod.daysToNext === 1 ? 'Day' : 'Days'}` : '—'}
          icon={CalendarIcon}
        />
        <StatCard
          label="Cycle Day"
          value={hasCycles && cycleDay ? `Day ${cycleDay}` : '—'}
          icon={Droplets}
        />
      </div>

      {hasCycles ? (
        <PhaseCard phaseInfo={todayUIPhase} subtitle={phaseSubtitle} />
      ) : (
        <div className="glass rounded-[2rem] p-6 mt-8 text-center">
          <p className="text-white/50">Log your first period with the + button below</p>
        </div>
      )}
    </motion.div>
  );
}
