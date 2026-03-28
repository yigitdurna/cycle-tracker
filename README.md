# Cycle Tracker

**[Live Demo](https://yigitdurna.github.io/cycle-tracker/)**

A privacy-focused menstrual cycle tracking app built with React, TypeScript, and Tailwind CSS. Features accurate phase predictions, an animated UI with phase-based color themes, and complete data privacy — all data stays on your device.

## Features

- **Phase-Based UI**: Background gradients, ring color, and insights shift automatically across Menstrual, Follicular, Ovulation, and Luteal phases.
- **Smart Predictions**: Median-based cycle length calculation with fertile window, ovulation, and next period predictions.
- **Interactive Calendar**: Custom calendar grid with phase-colored days, swipe navigation, and period logging via range selection.
- **Privacy First**: All data stored locally in the browser. No servers, no tracking, no accounts.
- **Data Portability**: JSON and CSV export/import for backups and analysis.
- **PWA**: Installable, works offline, app-like experience.

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Motion (animations)
- Lucide React (icons)
- date-fns (calendar math)
- vite-plugin-pwa (offline support)

## Development

```bash
npm install
npm run dev       # dev server on port 3000
npm run build     # production build
npm run lint      # type check
```

## Usage

1. **Log a Period**: Tap the + button, select start and end dates, tap "Log Period".
2. **View Phases**: Home screen shows current cycle day, phase, and next period countdown.
3. **Calendar**: Browse months with phase-colored day indicators.
4. **Edit/Delete**: History tab shows all logged cycles with edit and delete options.
5. **Export/Import**: Settings tab for JSON/CSV backup and restore.
