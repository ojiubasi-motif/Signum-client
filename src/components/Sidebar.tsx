import {
  LayoutDashboard,
  Radio,
  Briefcase,
  Trophy,
  Settings,
  LogOut,
  Zap,
  X,
} from 'lucide-react';
import type { Page } from '../types';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'signals', label: 'Signals', icon: Radio },
  { id: 'portfolio', label: 'My Portfolio', icon: Briefcase },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
];

const bottomItems: { id: Page; label: string; icon: typeof Settings }[] = [
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({
  currentPage,
  onNavigate,
  onLogout,
  isOpen,
  onClose,
}: SidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 flex flex-col bg-[#0e0e1a] border-r border-white/5 transition-transform duration-300 transform md:translate-x-0 md:static md:w-56 md:h-screen ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Logo */}
      <div className="px-5 py-6 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white fill-white" />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">
            Signum
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors md:hidden"
          aria-label="Close navigation menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 pt-2">
        <div className="space-y-0.5">
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = currentPage === id;
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon
                  size={17}
                  className={`transition-colors ${
                    active
                      ? 'text-emerald-400'
                      : 'text-gray-500 group-hover:text-gray-300'
                  }`}
                />
                {label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom nav */}
      <div className="px-3 pb-4 space-y-0.5">
        {bottomItems.map(({ id, label, icon: Icon }) => {
          const active = currentPage === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                active
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon
                size={17}
                className={`transition-colors ${
                  active
                    ? 'text-emerald-400'
                    : 'text-gray-500 group-hover:text-gray-300'
                }`}
              />
              {label}
            </button>
          );
        })}

        {/* Logout button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-all duration-150 group"
        >
          <LogOut
            size={17}
            className="text-red-400/50 group-hover:text-red-400 transition-colors"
          />
          Logout
        </button>

        {/* AI promo banner */}
        <div className="mt-4 mx-0 p-3.5 rounded-xl bg-gradient-to-br from-emerald-900/40 to-teal-900/30 border border-emerald-700/30">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 bg-emerald-500 rounded-md flex items-center justify-center">
              <Zap size={11} className="text-white fill-white" />
            </div>
            <span className="text-white text-xs font-semibold">
              AI-Powered Signals
            </span>
          </div>
          <p className="text-gray-400 text-xs leading-relaxed">
            Enriched with Claude AI analysis
          </p>
        </div>
      </div>
    </aside>
  );
}
