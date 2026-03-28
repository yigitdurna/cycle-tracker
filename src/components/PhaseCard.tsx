import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Droplets, Sparkles, Zap, Moon } from 'lucide-react';
import type { PhaseInfo } from '../types';

interface PhaseCardProps {
  phaseInfo: PhaseInfo;
  subtitle?: string;
}

export function PhaseCard({ phaseInfo, subtitle }: PhaseCardProps) {
  const Icon = useMemo(() => {
    switch (phaseInfo.name) {
      case 'Menstrual': return Droplets;
      case 'Follicular': return Sparkles;
      case 'Ovulation': return Zap;
      case 'Luteal': return Moon;
    }
  }, [phaseInfo.name]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-[2rem] p-6 mt-8 relative overflow-hidden"
    >
      <div className="flex gap-4 items-center relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
          <Icon size={24} style={{ color: phaseInfo.color }} />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{phaseInfo.name}</h3>
          <p className="text-sm text-white/50">{subtitle ?? 'Your current phase'}</p>
        </div>
      </div>
      <p className="mt-4 text-white/70 leading-relaxed">
        {phaseInfo.description}
      </p>

      {/* Decorative Gradient */}
      <div
        className="absolute -right-10 -bottom-10 w-40 h-40 blur-3xl opacity-20 rounded-full"
        style={{ backgroundColor: phaseInfo.color }}
      />
    </motion.div>
  );
}
