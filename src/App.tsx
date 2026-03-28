import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { useCycles } from './hooks/useCycles';
import { useDayLogs } from './hooks/useDayLogs';
import { useSettings } from './hooks/useSettings';
import { getCycleStats } from './lib/cycle-math';
import { NavBar, type Tab } from './components/NavBar';
import { HomeView } from './views/HomeView';
import { CalendarView } from './views/CalendarView';
import { HistoryView } from './views/HistoryView';
import { SettingsView } from './views/SettingsView';
import { LogPeriodSheet } from './components/LogPeriodSheet';
import { useInsights } from './hooks/useInsights';
import { phaseTypeToUI } from './types';
import type { Cycle, DayLog } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [logSheetOpen, setLogSheetOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);

  const handleTabChange = (tab: Tab) => {
    if (tab === activeTab) {
      setActiveTab('home');
    } else {
      setActiveTab(tab);
    }
  };

  const { customCycleLength, setCustomCycleLength } = useSettings();

  const {
    cycles,
    addCycle,
    updateCycle,
    deleteCycle,
    clearAll,
    todayPhase,
    todayUIPhase,
    nextPeriod,
    cycleDay,
    exportJSON,
    exportCSV,
    importCSV,
    importJSON,
    getPhaseForDate,
  } = useCycles(customCycleLength ?? 28);

  const { allLogs, todayLog, setLog, clearAllLogs } = useDayLogs();

  const { getPhaseDescription, todayInsights, insights, hasEnoughData } = useInsights(allLogs, cycles, todayLog);

  const handleUpdateLog = (partial: Partial<DayLog>) => {
    const today = new Date().toISOString().slice(0, 10);
    const current = todayLog ?? { date: today };
    const merged = { ...current, ...partial };
    setLog(today, merged);
  };

  const shareSummary = useMemo(() => {
    if (!cycles.length) return undefined;
    const parts: string[] = ['cycle vault summary'];
    if (cycleDay) parts.push(`Cycle day: ${cycleDay}`);
    if (todayPhase) parts.push(`Phase: ${phaseTypeToUI(todayPhase.type)}`);
    if (nextPeriod) parts.push(`Next period: in ${nextPeriod.daysToNext} day${nextPeriod.daysToNext === 1 ? '' : 's'}`);
    if (todayLog) {
      if (todayLog.mood?.length) parts.push(`Mood: ${todayLog.mood.join(', ')}`);
      if (todayLog.flow) parts.push(`Flow: ${todayLog.flow}`);
      if (todayLog.cramps) parts.push(`Cramps: ${['mild', 'moderate', 'severe'][todayLog.cramps - 1]}`);
    }
    return parts.join('\n');
  }, [cycles.length, cycleDay, todayPhase, nextPeriod, todayLog]);

  const handleUpdateLogForDate = (date: string, partial: Partial<DayLog>) => {
    const current = allLogs[date] ?? { date };
    const merged = { ...current, ...partial };
    setLog(date, merged);
  };

  const openLogSheet = () => {
    setEditingCycle(null);
    setLogSheetOpen(true);
  };

  const openEditSheet = (cycle: Cycle) => {
    setEditingCycle(cycle);
    setLogSheetOpen(true);
  };

  const handleLogSave = (start: string, end: string) => {
    if (editingCycle) {
      updateCycle(editingCycle.start, start, end);
    } else {
      addCycle(start, end);
    }
    setLogSheetOpen(false);
    setEditingCycle(null);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Background Gradient */}
      <AnimatePresence mode="wait">
        <motion.div
          key={todayUIPhase.name}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className={cn(
            'fixed inset-0 bg-gradient-to-b transition-colors duration-1000',
            todayUIPhase.gradient
          )}
        />
      </AnimatePresence>

      {/* Ambient warm light — gives glass something to refract */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
        <div
          className="absolute -top-1/4 -left-1/4 w-[80%] h-[80%] rounded-full opacity-[0.12] blur-[120px]"
          style={{ backgroundColor: todayUIPhase.color }}
        />
        <div
          className="absolute -bottom-1/3 -right-1/4 w-[60%] h-[60%] rounded-full opacity-[0.08] blur-[100px]"
          style={{ backgroundColor: todayUIPhase.color }}
        />
        {/* Warm base glow — always present */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[70%] h-[50%] rounded-full opacity-[0.04] blur-[100px] bg-amber-700" />
      </div>

      {/* Content */}
      <main className="relative z-10 flex-1 px-6 pt-12 pb-32 max-w-lg mx-auto w-full">
        {/* Header */}
        <header className="flex items-center mb-12">
          <div className="flex items-center gap-3">
            <img src={import.meta.env.BASE_URL + 'flower.png'} alt="" className="w-8 h-8" />
            <h1 className="text-2xl font-bold lowercase" style={{ fontFamily: '"Lora", serif' }}>cycle vault</h1>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <HomeView
              key="home"
              todayPhase={todayPhase}
              todayUIPhase={todayUIPhase}
              nextPeriod={nextPeriod}
              cycleDay={cycleDay}
              cycles={cycles}
              todayLog={todayLog}
              onUpdateLog={handleUpdateLog}
              todayInsights={todayInsights}
              insights={insights}
              hasEnoughData={hasEnoughData}
              getPhaseDescription={getPhaseDescription}
              customCycleLength={customCycleLength ?? 28}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              key="calendar"
              cycles={cycles}
              getPhaseForDate={getPhaseForDate}
              dayLogs={allLogs}
              onUpdateLog={handleUpdateLogForDate}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              key="history"
              cycles={cycles}
              onEdit={openEditSheet}
              onDelete={deleteCycle}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              key="settings"
              cycles={cycles}
              onExportJSON={() => exportJSON(allLogs)}
              onExportCSV={() => exportCSV(allLogs)}
              onImportCSV={importCSV}
              onImportJSON={async (file) => {
                const result = await importJSON(file);
                // Merge imported dayLogs
                if (Object.keys(result.dayLogs).length > 0) {
                  for (const [date, log] of Object.entries(result.dayLogs)) {
                    if (!allLogs[date]) setLog(date, log);
                  }
                }
                return result.cycles;
              }}
              onClearAll={() => { clearAll(); clearAllLogs(); }}
              shareSummary={shareSummary}
              customCycleLength={customCycleLength}
              onSetCycleLength={setCustomCycleLength}
              computedCycleLength={getCycleStats(cycles)?.med}
            />
          )}
        </AnimatePresence>
      </main>

      <NavBar activeTab={activeTab} onTabChange={handleTabChange} onAdd={openLogSheet} />

      <LogPeriodSheet
        open={logSheetOpen}
        editingCycle={editingCycle}
        onSave={handleLogSave}
        onClose={() => { setLogSheetOpen(false); setEditingCycle(null); }}
      />
    </div>
  );
}
