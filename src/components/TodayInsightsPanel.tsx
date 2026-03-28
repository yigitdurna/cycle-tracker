import type { Insight } from '../types';
import { InsightCard } from './InsightCard';

interface TodayInsightsPanelProps {
  insights: Insight[];
}

export function TodayInsightsPanel({ insights }: TodayInsightsPanelProps) {
  if (insights.length === 0) return null;

  return (
    <div className="w-full mt-6 space-y-3">
      <p className="text-xs text-white/40 uppercase tracking-wider font-medium">
        Today
      </p>
      {insights.map((insight, i) => (
        <InsightCard key={insight.id} insight={insight} index={i} />
      ))}
    </div>
  );
}
