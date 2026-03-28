import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings as SettingsIcon } from 'lucide-react';
import { cn } from './lib/utils';
import { useCycles } from './hooks/useCycles';
import { NavBar, type Tab } from './components/NavBar';
import { HomeView } from './views/HomeView';
import { CalendarView } from './views/CalendarView';
import { HistoryView } from './views/HistoryView';
import { SettingsView } from './views/SettingsView';
import { LogPeriodSheet } from './components/LogPeriodSheet';
import type { Cycle } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [prevTab, setPrevTab] = useState<Tab>('home');
  const [logSheetOpen, setLogSheetOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);

  const handleTabChange = (tab: Tab) => {
    if (tab === activeTab) {
      // Clicking active tab returns to home
      setActiveTab('home');
    } else if (tab === 'settings') {
      // Remember where we were before settings
      setPrevTab(activeTab);
      setActiveTab('settings');
    } else {
      setActiveTab(tab);
    }
  };

  const handleSettingsToggle = () => {
    if (activeTab === 'settings') {
      setActiveTab(prevTab);
    } else {
      setPrevTab(activeTab);
      setActiveTab('settings');
    }
  };

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
    getPhaseForDate,
  } = useCycles();

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
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-2xl font-serif font-bold italic">Cycle Tracker</h1>
          </div>
          <button
            onClick={handleSettingsToggle}
            className="w-10 h-10 rounded-full glass flex items-center justify-center"
          >
            <SettingsIcon size={20} className="text-white/60" />
          </button>
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
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              key="calendar"
              cycles={cycles}
              getPhaseForDate={getPhaseForDate}
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
              onExportJSON={exportJSON}
              onExportCSV={exportCSV}
              onImportCSV={importCSV}
              onClearAll={clearAll}
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
