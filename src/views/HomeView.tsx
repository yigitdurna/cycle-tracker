import { motion } from 'motion/react';
import { Calendar as CalendarIcon, Droplets } from 'lucide-react';
import { CycleRing } from '../components/CycleRing';
import { StatCard } from '../components/StatCard';
import { PhaseCard } from '../components/PhaseCard';
import { SymptomPills } from '../components/SymptomPills';
import { TodayInsightsPanel } from '../components/TodayInsightsPanel';
import { InsightsPanel } from '../components/InsightsPanel';
import type { PhaseInfo, PhaseResult, Insight, CyclePhase } from '../types';
import type { Cycle, DayLog } from '../types';
import { getCycleStats } from '../lib/cycle-math';

interface HomeViewProps {
  todayPhase: PhaseResult | null;
  todayUIPhase: PhaseInfo;
  nextPeriod: { date: string; daysToNext: number } | null;
  cycleDay: number | null;
  cycles: Cycle[];
  todayLog: DayLog | undefined;
  onUpdateLog: (log: Partial<DayLog>) => void;
  todayInsights: Insight[];
  insights: Insight[];
  hasEnoughData: boolean;
  getPhaseDescription: (phase: CyclePhase) => string | null;
  customCycleLength: number;
}

export function HomeView({ todayPhase, todayUIPhase, nextPeriod, cycleDay, cycles, todayLog, onUpdateLog, todayInsights, insights, hasEnoughData, getPhaseDescription, customCycleLength }: HomeViewProps) {
  const stats = getCycleStats(cycles, customCycleLength);
  const totalDays = stats?.med ?? customCycleLength;
  const displayDay = cycleDay ?? 1;

  let phaseSubtitle: string | undefined;
  if (todayPhase) {
    if (todayPhase.type === 'period') {
      phaseSubtitle = `Day ${todayPhase.day} of your period`;
    }
  }

  const hasCycles = cycles.length > 0;

  // Replace static phase description with personalized one when available
  const personalDesc = getPhaseDescription(todayUIPhase.name);
  const phaseInfoWithPersonalization = personalDesc
    ? { ...todayUIPhase, description: personalDesc }
    : todayUIPhase;

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

      {hasCycles && (
        <TodayInsightsPanel insights={todayInsights} />
      )}

      {hasCycles && (
        <SymptomPills log={todayLog} onUpdate={onUpdateLog} />
      )}

      {hasCycles && (
        <InsightsPanel insights={insights} hasEnoughData={hasEnoughData} />
      )}

      {hasCycles ? (
        <PhaseCard phaseInfo={phaseInfoWithPersonalization} subtitle={phaseSubtitle} />
      ) : (
        <div className="glass rounded-[2rem] p-6 mt-8 text-center">
          <p className="text-white/50">Log your first period with the + button below</p>
        </div>
      )}
    </motion.div>
  );
}
