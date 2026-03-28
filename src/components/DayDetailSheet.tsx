import { motion, AnimatePresence } from 'motion/react';
import { X, Droplets, Moon, Zap, Frown, Pencil } from 'lucide-react';
import { nice } from '../lib/cycle-math';
import type { DayLog, MoodValue, Severity, SleepQuality, FlowLevel } from '../types';

interface DayDetailSheetProps {
  open: boolean;
  date: string; // "YYYY-MM-DD"
  log: DayLog | undefined;
  phaseName: string;
  phaseColor: string;
  onClose: () => void;
  onUpdateLog: (date: string, log: Partial<DayLog>) => void;
}

const MOOD_LABELS: Record<MoodValue, string> = {
  anxious: 'Anxious',
  sad: 'Sad',
  irritable: 'Irritable',
  energetic: 'Energetic',
  calm: 'Calm',
  happy: 'Happy',
};

const FLOW_LABELS: Record<FlowLevel, string> = {
  spotting: 'Spotting',
  light: 'Light',
  medium: 'Medium',
  heavy: 'Heavy',
};

function SeverityBar({ value, max = 3 }: { value: number; max?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i < value ? 'bg-accent' : 'bg-white/10'
          }`}
        />
      ))}
    </div>
  );
}

function SeverityLabel(value: Severity): string {
  switch (value) {
    case 1: return 'Low';
    case 2: return 'Medium';
    case 3: return 'High';
  }
}

function SleepLabel(value: SleepQuality): string {
  switch (value) {
    case 1: return 'Poor';
    case 2: return 'Fair';
    case 3: return 'Good';
  }
}

const PAIN_LABELS: Record<string, string> = {
  head: 'Head',
  breast: 'Breast',
  back: 'Back',
  joints: 'Joints',
};

export function DayDetailSheet({ open, date, log, phaseName, phaseColor, onClose }: DayDetailSheetProps) {
  const hasData = log && (
    log.mood?.length ||
    log.energy ||
    log.cramps ||
    log.sleep ||
    log.flow ||
    log.pain ||
    log.note ||
    log.functionalImpact
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-lg glass rounded-t-[2rem] p-6 pb-10 max-h-[85vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-serif font-bold">{nice(date)}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: phaseColor }}
                  />
                  <span className="text-sm text-white/50">{phaseName}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            {hasData ? (
              <div className="space-y-4">
                {/* Flow */}
                {log.flow && (
                  <div className="flex items-center gap-3 glass rounded-2xl p-3">
                    <Droplets size={16} className="text-menstrual shrink-0" />
                    <span className="text-sm font-medium">Flow</span>
                    <span className="text-sm text-white/50 ml-auto">{FLOW_LABELS[log.flow]}</span>
                  </div>
                )}

                {/* Mood */}
                {log.mood && log.mood.length > 0 && (
                  <div className="glass rounded-2xl p-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <Frown size={16} className="text-ovulation shrink-0" />
                      <span className="text-sm font-medium">Mood</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pl-7">
                      {log.mood.map(m => (
                        <span key={m} className="text-xs bg-white/10 rounded-full px-3 py-1">
                          {MOOD_LABELS[m]}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Energy */}
                {log.energy && (
                  <div className="flex items-center gap-3 glass rounded-2xl p-3">
                    <Zap size={16} className="text-follicular shrink-0" />
                    <span className="text-sm font-medium">Energy</span>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-xs text-white/40">{SeverityLabel(log.energy)}</span>
                      <SeverityBar value={log.energy} />
                    </div>
                  </div>
                )}

                {/* Cramps */}
                {log.cramps && (
                  <div className="flex items-center gap-3 glass rounded-2xl p-3">
                    <div className="w-4 h-4 shrink-0 flex items-center justify-center text-menstrual text-xs font-bold">~</div>
                    <span className="text-sm font-medium">Cramps</span>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-xs text-white/40">{SeverityLabel(log.cramps)}</span>
                      <SeverityBar value={log.cramps} />
                    </div>
                  </div>
                )}

                {/* Sleep */}
                {log.sleep && (
                  <div className="flex items-center gap-3 glass rounded-2xl p-3">
                    <Moon size={16} className="text-luteal shrink-0" />
                    <span className="text-sm font-medium">Sleep</span>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-xs text-white/40">{SleepLabel(log.sleep)}</span>
                      <SeverityBar value={log.sleep} />
                    </div>
                  </div>
                )}

                {/* Pain */}
                {log.pain && log.pain.locations.length > 0 && (
                  <div className="glass rounded-2xl p-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 shrink-0 flex items-center justify-center text-menstrual text-xs font-bold">!</div>
                      <span className="text-sm font-medium">Pain</span>
                      <div className="ml-auto flex items-center gap-2">
                        <span className="text-xs text-white/40">{SeverityLabel(log.pain.severity)}</span>
                        <SeverityBar value={log.pain.severity} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pl-7">
                      {log.pain.locations.map(loc => (
                        <span key={loc} className="text-xs bg-white/10 rounded-full px-3 py-1">
                          {PAIN_LABELS[loc]}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Functional Impact */}
                {log.functionalImpact && (
                  <div className="glass rounded-2xl p-3">
                    <span className="text-xs text-menstrual/80">Affected daily activities</span>
                  </div>
                )}

                {/* Note */}
                {log.note && (
                  <div className="glass rounded-2xl p-3">
                    <p className="text-sm text-white/60 italic">{log.note}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-white/30 text-sm">No symptoms logged for this day</p>
              </div>
            )}

            {/* Action button */}
            <button
              onClick={onClose}
              className="w-full mt-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Pencil size={14} />
              {hasData ? 'Edit Symptoms' : 'Log Symptoms'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
