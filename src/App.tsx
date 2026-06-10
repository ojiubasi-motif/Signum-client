import { useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { logout } from './store/slices/authSlice';
import { clearSignals } from './store/slices/signalsSlice';
import { clearPortfolio } from './store/slices/portfolioSlice';
import { clearAdmins } from './store/slices/adminsSlice';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
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

  const handleLogout = () => {
    dispatch(logout());
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
    </div>
  );
}

function AppGate() {
  const token = useAppSelector((s) => s.auth.token);

  if (!token) {
    return <Login />;
  }

  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <Provider store={store}>
      <AppGate />
    </Provider>
  );
}
