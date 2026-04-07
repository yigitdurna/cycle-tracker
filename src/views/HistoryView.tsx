import { useState } from 'react';
import { motion } from 'motion/react';
import { Pencil, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { nice, diff, fromYmd } from '../lib/cycle-math';
import { cn } from '../lib/utils';
import type { Cycle } from '../types';

interface HistoryViewProps {
  cycles: Cycle[];
  onEdit: (cycle: Cycle) => void;
  onDelete: (start: string) => void;
}

export function HistoryView({ cycles, onEdit, onDelete }: HistoryViewProps) {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const sorted = [...cycles].sort((a, b) => b.start.localeCompare(a.start));

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <h2 className="text-3xl font-serif font-bold">History</h2>

      {sorted.length === 0 ? (
        <div className="glass rounded-[2rem] p-6 text-center">
          <p className="text-white/50">No cycles logged yet</p>
          <p className="text-white/30 text-sm mt-1">Use the + button to log your first period</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((cycle) => {
            const startDate = fromYmd(cycle.start);
            const month = startDate.toLocaleDateString(undefined, { month: 'long' });
            const duration = cycle.end ? diff(cycle.end, cycle.start) + 1 : null;
            const isActive = cycle.end === null;

            return (
              <div key={cycle.start} className={cn(
                'glass rounded-3xl p-5 flex items-center justify-between',
                isActive && 'border border-menstrual/30'
              )}>
                <div>
                  <p className="font-semibold text-lg">
                    {month}
                    {isActive && (
                      <span className="ml-2 text-xs font-normal text-menstrual/80">Ongoing</span>
                    )}
                  </p>
                  <p className="text-xs text-white/40">
                    Started {nice(cycle.start)}
                    {duration && ` · ${duration} days`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(cycle)}
                    className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <Pencil size={14} className="text-white/50" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(cycle.start)}
                    className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-menstrual/20 transition-colors"
                  >
                    <Trash2 size={14} className="text-white/50" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Cycle"
        message="This will permanently remove this cycle from your history."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) onDelete(deleteTarget);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </motion.div>
  );
}
