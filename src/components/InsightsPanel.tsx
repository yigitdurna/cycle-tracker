import type { Insight } from '../types';
import { InsightCard } from './InsightCard';

interface InsightsPanelProps {
  insights: Insight[];
  hasEnoughData: boolean;
}

export function InsightsPanel({ insights, hasEnoughData }: InsightsPanelProps) {
  if (!hasEnoughData) {
    return (
      <div className="glass rounded-[2rem] p-5 mt-6 text-center">
        <p className="text-xs text-white/30">Log 2+ cycles to see personalized insights</p>
      </div>
    );
  }

  return (
    <div className="w-full mt-6 space-y-3">
      <p className="text-xs text-white/40 uppercase tracking-wider font-medium">
        Your Patterns
      </p>
      {insights.length === 0 ? (
        <div className="glass rounded-[2rem] p-5 text-center">
          <p className="text-xs text-white/30">Log symptoms regularly to build up your patterns</p>
        </div>
      ) : (
        insights.map((insight, i) => (
          <InsightCard key={insight.id} insight={insight} index={i} />
        ))
      )}
    </div>
  );
}
