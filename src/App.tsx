import { useState } from 'react';
import { Bot } from 'lucide-react';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { logoutUser } from './store/slices/authSlice';
import { clearSignals } from './store/slices/signalsSlice';
import { clearPortfolio } from './store/slices/portfolioSlice';
import { clearAdmins } from './store/slices/adminsSlice';
import AuthInitializer from './components/AuthInitializer';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BotDialog from './components/BotDialog';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Signals from './pages/Signals';
import Portfolio from './pages/Portfolio';
import Leaderboard from './pages/Leaderboard';
import Settings from './pages/Settings';
import type { Page } from './types';

function AuthenticatedApp() {
  const dispatch = useAppDispatch();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBotOpen, setIsBotOpen] = useState(false);

  const handleLogout = async () => {
    // Revoke refresh token on server + clear httpOnly cookie
    await dispatch(logoutUser());
    dispatch(clearSignals());
    dispatch(clearPortfolio());
    dispatch(clearAdmins());
    // Full page reload clears any residual cache per secure session lifecycle guidelines
    window.location.href = '/';
  };

  const pageMap: Record<Page, React.ReactNode> = {
    dashboard: <Dashboard />,
    signals: <Signals />,
    portfolio: <Portfolio />,
    leaderboard: <Leaderboard />,
    settings: <Settings />,
  };

  return (
    <div className="flex h-screen bg-[#0a0a14] overflow-hidden relative">
      {/* Mobile sidebar backdrop overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          setIsSidebarOpen(false); // Auto-close drawer on navigation
        }}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          currentPage={currentPage}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto">{pageMap[currentPage]}</main>
      </div>

      {/* Floating Bot FAB */}
      <button
        id="bot-fab"
        onClick={() => setIsBotOpen(prev => !prev)}
        aria-label="Open Signum Bot"
        className={`fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          isBotOpen
            ? 'bg-emerald-500 shadow-emerald-500/40 scale-95'
            : 'bg-[#1a1a30] border border-emerald-500/40 hover:border-emerald-500 hover:bg-emerald-600/20 shadow-black/40 hover:scale-105'
        }`}
      >
        <Bot size={20} className={isBotOpen ? 'text-white' : 'text-emerald-400'} />
      </button>

      {/* Bot Dialog */}
      <BotDialog isOpen={isBotOpen} onClose={() => setIsBotOpen(false)} />
    </div>
  );
}

function AppGate() {
  const { initialized, member } = useAppSelector((s) => s.auth);

  // Show a minimal loading state while the silent restore is in progress.
  // This prevents a flash of the Login page on every browser refresh.
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a14]">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!member) {
    return <Login />;
  }

  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <Provider store={store}>
      <AuthInitializer />
      <AppGate />
    </Provider>
  );
}
