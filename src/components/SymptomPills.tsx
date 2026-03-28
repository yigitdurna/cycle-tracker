import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smile, Zap, Flame, Droplets, Activity, MessageSquare, Check } from 'lucide-react';
import type { DayLog, MoodValue, Severity, FlowLevel } from '../types';

interface SymptomPillsProps {
  log: DayLog | undefined;
  onUpdate: (log: Partial<DayLog>) => void;
}

type PopoverId = 'mood' | 'flow' | 'pain' | null;

const MOODS: { value: MoodValue; label: string }[] = [
  { value: 'anxious', label: 'Anxious' },
  { value: 'sad', label: 'Sad' },
  { value: 'irritable', label: 'Irritable' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'calm', label: 'Calm' },
  { value: 'happy', label: 'Happy' },
];

const FLOW_LEVELS: { value: FlowLevel; label: string }[] = [
  { value: 'spotting', label: 'Spotting' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
];

const PAIN_LOCATIONS = ['head', 'breast', 'back', 'joints'] as const;
const SEVERITY_LABELS: Record<Severity, string> = { 1: 'Mild', 2: 'Moderate', 3: 'Severe' };

function Pill({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors shrink-0 ${
        active
          ? 'bg-accent/20 border-accent/40 text-white'
          : 'bg-white/5 border-white/10 text-white/60'
      }`}
    >
      <Icon size={14} />
      <span>{label}</span>
      {active && <span className="w-1.5 h-1.5 rounded-full bg-accent ml-0.5" />}
    </button>
  );
}

function Popover({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div ref={ref} className="glass rounded-2xl p-3 mt-2 w-full">
      {children}
    </div>
  );
}

// Build a draft from the persisted log
function draftFromLog(log: DayLog | undefined): Partial<DayLog> {
  if (!log) return {};
  return {
    mood: log.mood,
    energy: log.energy,
    cramps: log.cramps,
    sleep: log.sleep,
    flow: log.flow,
    pain: log.pain,
    functionalImpact: log.functionalImpact,
    note: log.note,
  };
}

function draftsEqual(a: Partial<DayLog>, b: Partial<DayLog>): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function SymptomPills({ log, onUpdate }: SymptomPillsProps) {
  const [openPopover, setOpenPopover] = useState<PopoverId>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState(log?.note ?? '');
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Local draft state — not persisted until Save
  const [draft, setDraft] = useState<Partial<DayLog>>(() => draftFromLog(log));

  // Sync draft when log changes externally (e.g. initial load)
  useEffect(() => {
    setDraft(draftFromLog(log));
    setNoteText(log?.note ?? '');
  }, [log]);

  const isDirty = !draftsEqual(draft, draftFromLog(log));

  const flashSaved = useCallback(() => {
    setSaved(true);
    clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 2000);
  }, []);

  useEffect(() => () => clearTimeout(savedTimer.current), []);

  // --- Save handler ---
  const handleSave = useCallback(() => {
    onUpdate(draft);
    flashSaved();
  }, [draft, onUpdate, flashSaved]);

  useEffect(() => {
    if (noteOpen && noteRef.current) {
      noteRef.current.focus();
    }
  }, [noteOpen]);

  const toggle = (id: PopoverId) => {
    setOpenPopover(prev => (prev === id ? null : id));
  };

  // --- Draft mutators (local only, no persist) ---

  const handleEnergyCycle = () => {
    setOpenPopover(null);
    const current = draft.energy;
    if (!current) {
      setDraft(d => ({ ...d, energy: 1 }));
    } else if (current < 3) {
      setDraft(d => ({ ...d, energy: (current + 1) as Severity }));
    } else {
      setDraft(d => { const { energy: _, ...rest } = d; return rest; });
    }
  };

  const handleCrampsCycle = () => {
    setOpenPopover(null);
    const current = draft.cramps;
    if (!current) {
      setDraft(d => ({ ...d, cramps: 1 }));
    } else if (current < 3) {
      setDraft(d => ({ ...d, cramps: (current + 1) as Severity }));
    } else {
      setDraft(d => { const { cramps: _, ...rest } = d; return rest; });
    }
  };

  const toggleMood = (mood: MoodValue) => {
    const current = draft.mood ?? [];
    const next = current.includes(mood)
      ? current.filter(m => m !== mood)
      : [...current, mood];
    setDraft(d => ({ ...d, mood: next.length > 0 ? next : undefined }));
  };

  const selectFlow = (level: FlowLevel) => {
    setDraft(d => ({ ...d, flow: d.flow === level ? undefined : level }));
  };

  const togglePainLocation = (loc: typeof PAIN_LOCATIONS[number]) => {
    const current = draft.pain;
    const locations = current?.locations ?? [];
    const severity = current?.severity ?? 1;
    const next = locations.includes(loc)
      ? locations.filter(l => l !== loc)
      : [...locations, loc];
    if (next.length === 0) {
      setDraft(d => { const { pain: _, ...rest } = d; return rest; });
    } else {
      setDraft(d => ({ ...d, pain: { locations: next, severity } }));
    }
  };

  const setPainSeverity = (s: Severity) => {
    const current = draft.pain;
    if (!current || current.locations.length === 0) return;
    setDraft(d => ({ ...d, pain: { ...current, severity: s } }));
  };

  const setImpact = (value: boolean) => {
    setDraft(d => ({ ...d, functionalImpact: d.functionalImpact === value ? undefined : value }));
  };

  const handleNoteBlur = () => {
    const trimmed = noteText.trim();
    if (trimmed !== (draft.note ?? '')) {
      setDraft(d => ({ ...d, note: trimmed || undefined }));
    }
  };

  const energyLabel = draft.energy ? ['Low', 'Moderate', 'High'][draft.energy - 1] : 'Energy';
  const crampsLabel = draft.cramps ? ['Mild', 'Moderate', 'Severe'][draft.cramps - 1] : 'Cramps';

  return (
    <div className="w-full mt-8">
      <p className="text-sm text-white/30 font-serif italic mb-4">
        How are you feeling today?
      </p>

      {/* Pill row */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        <Pill
          icon={Smile}
          label="Mood"
          active={!!draft.mood?.length}
          onClick={() => toggle('mood')}
        />
        <Pill
          icon={Zap}
          label={energyLabel}
          active={!!draft.energy}
          onClick={handleEnergyCycle}
        />
        <Pill
          icon={Flame}
          label={crampsLabel}
          active={!!draft.cramps}
          onClick={handleCrampsCycle}
        />
        <Pill
          icon={Droplets}
          label="Flow"
          active={!!draft.flow}
          onClick={() => toggle('flow')}
        />
        <Pill
          icon={Activity}
          label="Pain"
          active={!!draft.pain}
          onClick={() => toggle('pain')}
        />
      </div>

      {/* Mood popover */}
      <Popover open={openPopover === 'mood'} onClose={() => setOpenPopover(null)}>
        <div className="flex flex-wrap gap-2">
          {MOODS.map(m => (
            <button
              key={m.value}
              onClick={() => toggleMood(m.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                draft.mood?.includes(m.value)
                  ? 'bg-accent/20 border-accent/40 text-white'
                  : 'bg-white/5 border-white/10 text-white/50'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </Popover>

      {/* Flow popover */}
      <Popover open={openPopover === 'flow'} onClose={() => setOpenPopover(null)}>
        <div className="flex flex-wrap gap-2">
          {FLOW_LEVELS.map(f => (
            <button
              key={f.value}
              onClick={() => selectFlow(f.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                draft.flow === f.value
                  ? 'bg-accent/20 border-accent/40 text-white'
                  : 'bg-white/5 border-white/10 text-white/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Popover>

      {/* Pain popover */}
      <Popover open={openPopover === 'pain'} onClose={() => setOpenPopover(null)}>
        <p className="text-xs text-white/40 mb-2">Location</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {PAIN_LOCATIONS.map(loc => (
            <button
              key={loc}
              onClick={() => togglePainLocation(loc)}
              className={`px-3 py-1 rounded-full text-xs font-medium border capitalize transition-colors ${
                draft.pain?.locations.includes(loc)
                  ? 'bg-accent/20 border-accent/40 text-white'
                  : 'bg-white/5 border-white/10 text-white/50'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
        {draft.pain && draft.pain.locations.length > 0 && (
          <>
            <p className="text-xs text-white/40 mb-2">Severity</p>
            <div className="flex gap-2">
              {([1, 2, 3] as Severity[]).map(s => (
                <button
                  key={s}
                  onClick={() => setPainSeverity(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    draft.pain?.severity === s
                      ? 'bg-accent/20 border-accent/40 text-white'
                      : 'bg-white/5 border-white/10 text-white/50'
                  }`}
                >
                  {SEVERITY_LABELS[s]}
                </button>
              ))}
            </div>
          </>
        )}
      </Popover>

      {/* Functional impact */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-white/40">Symptoms affected your day?</p>
        <div className="flex gap-2">
          <button
            onClick={() => setImpact(true)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              draft.functionalImpact === true
                ? 'bg-accent/20 border-accent/40 text-white'
                : 'bg-white/5 border-white/10 text-white/50'
            }`}
          >
            Yes
          </button>
          <button
            onClick={() => setImpact(false)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              draft.functionalImpact === false
                ? 'bg-accent/20 border-accent/40 text-white'
                : 'bg-white/5 border-white/10 text-white/50'
            }`}
          >
            No
          </button>
        </div>
      </div>

      {/* Note */}
      <div className="mt-3">
        {!noteOpen ? (
          <button
            onClick={() => setNoteOpen(true)}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            <MessageSquare size={12} />
            <span>{draft.note ? 'Edit note...' : 'Add note...'}</span>
          </button>
        ) : (
          <textarea
            ref={noteRef}
            value={noteText}
            onChange={e => setNoteText(e.target.value.slice(0, 500))}
            onBlur={() => {
              handleNoteBlur();
              if (!noteText.trim()) setNoteOpen(false);
            }}
            placeholder="How are you feeling?"
            maxLength={500}
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-accent/40 resize-none"
          />
        )}
      </div>

      {/* Save button + animation */}
      <div className="mt-5 flex justify-center">
        <AnimatePresence mode="wait">
          {saved ? (
            <motion.div
              key="saved"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 text-accent/70"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
              >
                <Check size={16} />
              </motion.div>
              <span className="text-sm font-medium">Saved</span>
            </motion.div>
          ) : isDirty ? (
            <motion.button
              key="save-btn"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              onClick={handleSave}
              className="px-8 py-2.5 rounded-full bg-accent/20 border border-accent/40 text-sm font-medium text-white hover:bg-accent/30 transition-colors"
            >
              Save
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
