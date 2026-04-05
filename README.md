# cycle vault

**[Live Demo](https://yigitdurna.github.io/cyclevault/)**

A privacy-focused menstrual cycle tracking PWA built with React, TypeScript, and Tailwind CSS. All data stays on your device — no accounts, no servers, no tracking.

## Features

- **Phase-Based UI**: Background gradients, ring color, and insights shift automatically across Menstrual, Follicular, Ovulation, and Luteal phases.
- **Smart Predictions**: Median-based cycle length calculation with fertile window, ovulation, and next period predictions backed by published research (Bull et al. 2019).
- **Daily Symptom Logging**: Track mood, flow, energy, cramps, pain, and sleep. Notes are timestamped and appended, not overwritten.
- **Personalized Insights**: Pattern recognition surfaces recurring symptoms by phase after enough cycles are logged.
- **Interactive Calendar**: Phase-colored day grid with swipe navigation and per-day symptom logging.
- **Privacy First**: All data stored locally in `localStorage`. No network requests, no analytics.
- **Data Portability**: JSON (full backup including symptoms) and CSV export/import.
- **PWA**: Installable on iOS and Android, works fully offline.

## Tech Stack

- React 19 + TypeScript
- Vite + vite-plugin-pwa
- Tailwind CSS v4
- Motion (animations)
- Lucide React (icons)
- date-fns (calendar math)
- Vitest (unit tests)

## Development

```bash
npm install
npm run dev       # dev server on port 3000
npm test          # run unit tests
npm run build     # production build
npm run lint      # type check
```

## Architecture

```
src/
├── lib/
│   ├── cycle-math.ts   # pure prediction engine (fully unit-tested)
│   ├── insights.ts     # pattern analysis from symptom logs
│   └── __tests__/      # Vitest test suites
├── hooks/
│   ├── useCycles.ts    # cycle CRUD + localStorage persistence
│   ├── useDayLogs.ts   # symptom log persistence with history snapshots
│   └── useSettings.ts  # user preferences (custom cycle length)
├── views/              # Home, Calendar, History, Settings
└── components/         # presentational components
```

## Usage

1. **Log a Period**: Tap the + button, select start and end dates.
2. **Track Symptoms**: Tap pills on the home screen to log mood, flow, energy, cramps, and notes.
3. **View Phases**: Home screen shows current cycle day, phase, and next period countdown.
4. **Calendar**: Browse months with phase-colored day indicators and per-day symptom detail.
5. **Insights**: After a few cycles, the app surfaces your personal symptom patterns.
6. **Export/Import**: Settings tab for JSON/CSV backup and restore.
