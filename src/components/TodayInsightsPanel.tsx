import { motion } from 'motion/react';
import { TrendingUp, AlertTriangle, BarChart3, Calendar } from 'lucide-react';
import type { Insight } from '../types';

const CATEGORY_CONFIG = {
  pattern: { icon: BarChart3, color: 'text-follicular' },
  anomaly: { icon: AlertTriangle, color: 'text-ovulation' },
  'cycle-length': { icon: Calendar, color: 'text-menstrual' },
  prediction: { icon: TrendingUp, color: 'text-luteal' },
} as const;

interface TodayInsightsPanelProps {
  insights: Insight[];
}

export function TodayInsightsPanel({ insights }: TodayInsightsPanelProps) {
  if (insights.length === 0) return null;

  return (
    <div className="w-full mt-6">
      <p className="text-xs text-white/40 uppercase tracking-wider font-medium mb-3">
        Today
      </p>
      <div className="flex gap-3 flex-wrap">
        {insights.map((insight, i) => {
          const config = CATEGORY_CONFIG[insight.category];
          const Icon = config.icon;
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-3xl p-4 flex-1 min-w-[140px] flex flex-col gap-2"
            >
              <div className="w-7 h-7 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                <Icon size={14} className={config.color} />
              </div>
              <div>
                <p className="text-xs font-semibold leading-snug">{insight.title}</p>
                <p className="text-xs text-white/40 mt-0.5 leading-relaxed line-clamp-3">{insight.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
