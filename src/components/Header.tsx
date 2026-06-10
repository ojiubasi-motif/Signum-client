import { Bell, Menu } from 'lucide-react';
import type { Page } from '../types';
import { useAppSelector } from '../store/hooks';

interface HeaderProps {
  currentPage: Page;
  onToggleSidebar: () => void;
}

const pageTitles: Record<Page, string> = {
  dashboard: 'Dashboard',
  signals: 'Active Signals',
  portfolio: 'My Portfolio',
  leaderboard: 'Leaderboard',
  settings: 'Settings',
};

export default function Header({ currentPage, onToggleSidebar }: HeaderProps) {
  const member = useAppSelector((s) => s.auth.member);
  const maskedPhone = member?.whatsappNumber
    ? `***${member.whatsappNumber.slice(-4)}`
    : '';

  return (
    <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-white/5 flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors md:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>
        <h1 className="text-white font-semibold text-sm sm:text-base">
          {pageTitles[currentPage]}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </button>
        {maskedPhone && (
          <span className="text-gray-400 text-xs font-mono bg-white/5 border border-white/8 rounded-lg px-2.5 sm:px-3 py-1.5">
            {maskedPhone}
          </span>
        )}
      </div>
    </header>
  );
}
