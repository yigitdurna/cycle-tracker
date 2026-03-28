import { motion } from 'motion/react';
import {
  Home as HomeIcon,
  Calendar as CalendarIcon,
  History as HistoryIcon,
  Settings,
  Plus,
} from 'lucide-react';
import { cn } from '../lib/utils';

export type Tab = 'home' | 'calendar' | 'history' | 'settings';

interface NavBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onAdd: () => void;
}

function NavButton({ active, onClick, icon: Icon }: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ size?: number }>;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300',
        active ? 'text-white' : 'text-white/30 hover:text-white/50'
      )}
    >
      <Icon size={20} />
      {active && (
        <motion.div
          layoutId="nav-dot"
          className="w-1 h-1 rounded-full bg-white mt-1"
        />
      )}
    </button>
  );
}

export function NavBar({ activeTab, onTabChange, onAdd }: NavBarProps) {
  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50">
      <div className="glass-dark rounded-[2.5rem] p-2 flex items-center justify-between shadow-2xl">
        <NavButton
          active={activeTab === 'home'}
          onClick={() => onTabChange('home')}
          icon={HomeIcon}
        />
        <NavButton
          active={activeTab === 'calendar'}
          onClick={() => onTabChange('calendar')}
          icon={CalendarIcon}
        />

        <button
          onClick={onAdd}
          className="w-14 h-14 rounded-full bg-white text-bg-dark flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
        >
          <Plus size={24} />
        </button>

        <NavButton
          active={activeTab === 'history'}
          onClick={() => onTabChange('history')}
          icon={HistoryIcon}
        />
        <NavButton
          active={activeTab === 'settings'}
          onClick={() => onTabChange('settings')}
          icon={Settings}
        />
      </div>
    </nav>
  );
}
