# System Context: Cycle Tracker

**Type:** PWA (Progressive Web App)
**Status:** v7.0 — React rebuild
**Privacy:** Local-first (localStorage, no cloud sync)

## Stack
- React 19 + TypeScript
- Vite (build tool)
- Tailwind CSS v4 (styling)
- Motion (animations)
- Lucide React (icons)
- date-fns (calendar math)
- vite-plugin-pwa (offline capability)

## Structure
```
src/
  App.tsx              — Root shell (tabs, background gradient, data flow)
  lib/cycle-math.ts    — Prediction engine (pure functions, exact port from v6)
  hooks/useCycles.ts   — React hook wrapping localStorage
  types.ts             — Data + UI types
  components/          — Reusable UI (CycleRing, NavBar, CalendarGrid, etc.)
  views/               — Tab views (Home, Calendar, History, Settings)
```

## Development
- `npm run dev` — dev server on port 3000
- `npm run build` — production build with PWA
- `npm run lint` — TypeScript check

## Data
- localStorage key: `cycle-tracker-calendar-v4`
- Format: `[{ start: "YYYY-MM-DD", end: "YYYY-MM-DD" | null }]`
- Same key/format as v6 — backward compatible

## Guidelines
- All data in localStorage. No cloud.
- Free, no ads, no IAP.
- Phase prediction logic in cycle-math.ts must not be modified without verification.
