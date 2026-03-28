import { motion } from 'motion/react';
import { TrendingUp, AlertTriangle, BarChart3, Calendar } from 'lucide-react';
import type { Insight } from '../types';

const CATEGORY_CONFIG = {
  pattern: { icon: BarChart3, color: 'text-follicular' },
  anomaly: { icon: AlertTriangle, color: 'text-ovulation' },
  'cycle-length': { icon: Calendar, color: 'text-menstrual' },
  prediction: { icon: TrendingUp, color: 'text-luteal' },
} as const;

interface InsightCardProps {
  insight: Insight;
  index: number;
}

export function InsightCard({ insight, index }: InsightCardProps) {
  const config = CATEGORY_CONFIG[insight.category];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass rounded-2xl p-4"
    >
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
          <Icon size={16} className={config.color} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{insight.title}</p>
          <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{insight.description}</p>
        </div>
      </div>
    </motion.div>
  );
}
