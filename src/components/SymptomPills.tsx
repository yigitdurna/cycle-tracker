import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smile, Zap, Flame, Droplets, Activity, MessageSquare, Check } from 'lucide-react';
import type { DayLog, MoodValue, Severity, FlowLevel } from '../types';

interface SymptomPillsProps {
  log: DayLog | undefined;
  onUpdate: (log: Partial<DayLog>) => void;
}

type PopoverId = 'mood' | 'energy' | 'cramps' | 'flow' | 'pain' | null;

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

const ENERGY_LEVELS: { value: Severity; label: string }[] = [
  { value: 1, label: 'Low' },
  { value: 2, label: 'Moderate' },
  { value: 3, label: 'High' },
];

const CRAMPS_LEVELS: { value: Severity; label: string }[] = [
  { value: 1, label: 'Mild' },
  { value: 2, label: 'Moderate' },
  { value: 3, label: 'Severe' },
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
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="glass rounded-2xl p-3 mt-2 w-full">
      {children}
    </div>
  );
}

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

function OptionButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
        active
          ? 'bg-accent/20 border-accent/40 text-white'
          : 'bg-white/5 border-white/10 text-white/50'
      }`}
    >
      {label}
    </button>
  );
}

export function SymptomPills({ log, onUpdate }: SymptomPillsProps) {
  const [openPopover, setOpenPopover] = useState<PopoverId>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState(log?.note ?? '');
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [draft, setDraft] = useState<Partial<DayLog>>(() => draftFromLog(log));

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

  // --- Draft mutators ---

  const toggleMood = (mood: MoodValue) => {
    const current = draft.mood ?? [];
    const next = current.includes(mood)
      ? current.filter(m => m !== mood)
      : [...current, mood];
    setDraft(d => ({ ...d, mood: next.length > 0 ? next : undefined }));
  };

  const selectEnergy = (level: Severity) => {
    setDraft(d => ({ ...d, energy: d.energy === level ? undefined : level }));
  };

  const selectCramps = (level: Severity) => {
    setDraft(d => ({ ...d, cramps: d.cramps === level ? undefined : level }));
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
        <Pill icon={Smile} label="Mood" active={!!draft.mood?.length} onClick={() => toggle('mood')} />
        <Pill icon={Zap} label={energyLabel} active={!!draft.energy} onClick={() => toggle('energy')} />
        <Pill icon={Flame} label={crampsLabel} active={!!draft.cramps} onClick={() => toggle('cramps')} />
        <Pill icon={Droplets} label="Flow" active={!!draft.flow} onClick={() => toggle('flow')} />
        <Pill icon={Activity} label="Pain" active={!!draft.pain} onClick={() => toggle('pain')} />
      </div>

      {/* Mood popover */}
      <Popover open={openPopover === 'mood'} onClose={() => setOpenPopover(null)}>
        <div className="flex flex-wrap gap-2">
          {MOODS.map(m => (
            <OptionButton key={m.value} label={m.label} active={draft.mood?.includes(m.value) ?? false} onClick={() => toggleMood(m.value)} />
          ))}
        </div>
      </Popover>

      {/* Energy popover */}
      <Popover open={openPopover === 'energy'} onClose={() => setOpenPopover(null)}>
        <div className="flex flex-wrap gap-2">
          {ENERGY_LEVELS.map(e => (
            <OptionButton key={e.value} label={e.label} active={draft.energy === e.value} onClick={() => selectEnergy(e.value)} />
          ))}
        </div>
      </Popover>

      {/* Cramps popover */}
      <Popover open={openPopover === 'cramps'} onClose={() => setOpenPopover(null)}>
        <div className="flex flex-wrap gap-2">
          {CRAMPS_LEVELS.map(c => (
            <OptionButton key={c.value} label={c.label} active={draft.cramps === c.value} onClick={() => selectCramps(c.value)} />
          ))}
        </div>
      </Popover>

      {/* Flow popover */}
      <Popover open={openPopover === 'flow'} onClose={() => setOpenPopover(null)}>
        <div className="flex flex-wrap gap-2">
          {FLOW_LEVELS.map(f => (
            <OptionButton key={f.value} label={f.label} active={draft.flow === f.value} onClick={() => selectFlow(f.value)} />
          ))}
        </div>
      </Popover>

      {/* Pain popover */}
      <Popover open={openPopover === 'pain'} onClose={() => setOpenPopover(null)}>
        <p className="text-xs text-white/40 mb-2">Location</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {PAIN_LOCATIONS.map(loc => (
            <OptionButton key={loc} label={loc.charAt(0).toUpperCase() + loc.slice(1)} active={draft.pain?.locations.includes(loc) ?? false} onClick={() => togglePainLocation(loc)} />
          ))}
        </div>
        {draft.pain && draft.pain.locations.length > 0 && (
          <>
            <p className="text-xs text-white/40 mb-2">Severity</p>
            <div className="flex gap-2">
              {([1, 2, 3] as Severity[]).map(s => (
                <OptionButton key={s} label={SEVERITY_LABELS[s]} active={draft.pain?.severity === s} onClick={() => setPainSeverity(s)} />
              ))}
            </div>
          </>
        )}
      </Popover>

      {/* Functional impact */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-white/40">Symptoms affected your day?</p>
        <div className="flex gap-2">
          <OptionButton label="Yes" active={draft.functionalImpact === true} onClick={() => setImpact(true)} />
          <OptionButton label="No" active={draft.functionalImpact === false} onClick={() => setImpact(false)} />
        </div>
      </div>

      {/* Note */}
      <div className="mt-3">
        {!noteOpen ? (
          draft.note ? (
            <button
              onClick={() => setNoteOpen(true)}
              className="w-full text-left glass rounded-xl px-3 py-2 group"
            >
              <div className="flex items-start gap-2">
                <MessageSquare size={12} className="text-white/30 mt-0.5 shrink-0" />
                <p className="text-xs text-white/60 leading-relaxed line-clamp-3">{draft.note}</p>
              </div>
            </button>
          ) : (
            <button
              onClick={() => setNoteOpen(true)}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              <MessageSquare size={12} />
              <span>Add note...</span>
            </button>
          )
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
