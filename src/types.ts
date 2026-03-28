// --- Data types (matching localStorage format) ---

export interface Cycle {
  start: string; // "YYYY-MM-DD"
  end: string | null;
}

// --- Phase prediction results ---

export type PhaseType = 'period' | 'fertile' | 'ovulation' | 'luteal' | 'follicular' | 'future';

export interface PhaseResult {
  type: PhaseType;
  day?: number;
  recorded?: boolean;
  msg?: string;
  fertileStart?: Date;
  fertileEnd?: Date;
}

// --- UI phase types (for theming/display) ---

export type CyclePhase = 'Menstrual' | 'Follicular' | 'Ovulation' | 'Luteal';

export interface PhaseInfo {
  name: CyclePhase;
  color: string;
  description: string;
  range: [number, number];
  gradient: string;
}

export const PHASES: Record<CyclePhase, PhaseInfo> = {
  Menstrual: {
    name: 'Menstrual',
    color: 'var(--color-menstrual)',
    description: 'Your body is shedding the uterine lining. Focus on rest and gentle movement.',
    range: [1, 5],
    gradient: 'from-rose-950/60 via-red-950/25 to-bg-warm',
  },
  Follicular: {
    name: 'Follicular',
    color: 'var(--color-follicular)',
    description: 'Estrogen levels are rising. You might feel more energetic and creative.',
    range: [6, 13],
    gradient: 'from-emerald-950/50 via-green-950/20 to-bg-warm',
  },
  Ovulation: {
    name: 'Ovulation',
    color: 'var(--color-ovulation)',
    description: 'The peak of your fertility. Energy and confidence are at their highest.',
    range: [14, 14],
    gradient: 'from-yellow-950/50 via-amber-950/25 to-bg-warm',
  },
  Luteal: {
    name: 'Luteal',
    color: 'var(--color-luteal)',
    description: 'Progesterone rises. Focus on grounding activities and self-care.',
    range: [15, 28],
    gradient: 'from-purple-950/50 via-rose-950/20 to-bg-warm',
  },
};

/** Map engine phase type → UI phase */
export function phaseTypeToUI(type: PhaseType): CyclePhase {
  switch (type) {
    case 'period': return 'Menstrual';
    case 'fertile': return 'Follicular'; // fertile window is during follicular
    case 'ovulation': return 'Ovulation';
    case 'luteal': return 'Luteal';
    case 'follicular': return 'Follicular';
    case 'future': return 'Follicular'; // default
  }
}
