import { useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Radio,
  Trophy,
  Briefcase,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchActiveSignals, fetchSignalHistory } from '../store/slices/signalsSlice';
import { fetchPortfolio } from '../store/slices/portfolioSlice';
import { fetchAdminStats } from '../store/slices/adminsSlice';

function fmt(n: number, d = 2) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'text-white',
}: {
  icon: typeof Radio;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-[#131320] border border-white/6 rounded-2xl p-5 flex flex-col gap-1">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
          <Icon size={16} className="text-emerald-400" />
        </div>
        <span className="text-gray-400 text-xs font-medium">{label}</span>
      </div>
      <span className={`text-2xl font-bold tracking-tight ${color}`}>
        {value}
      </span>
      {sub && <span className="text-gray-500 text-xs">{sub}</span>}
    </div>
  );
}

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const member = useAppSelector((s) => s.auth.member);
  const { active, history, loadingActive } = useAppSelector((s) => s.signals);
  const { data: portfolio, loading: loadingPortfolio } = useAppSelector(
    (s) => s.portfolio,
  );
  const { list: admins } = useAppSelector((s) => s.admins);

  useEffect(() => {
    dispatch(fetchActiveSignals());
    dispatch(fetchSignalHistory());
    dispatch(fetchAdminStats());
    if (member?.id) {
      dispatch(fetchPortfolio(member.id));
    }
  }, [dispatch, member?.id]);

  const totalSignals = active.length + history.length;
  const winRate =
    portfolio && portfolio.winCount + portfolio.lossCount > 0
      ? (
          (portfolio.winCount / (portfolio.winCount + portfolio.lossCount)) *
          100
        ).toFixed(1)
      : '—';

  const topAdmin = admins.length > 0 ? admins[0] : null;

  const isLoading = loadingActive || loadingPortfolio;

  if (isLoading && !portfolio && active.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={32} className="text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4 overflow-y-auto h-full">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Radio}
          label="Active Signals"
          value={String(active.length)}
          sub={`${totalSignals} total all time`}
        />
        <StatCard
          icon={Briefcase}
          label="Portfolio P&L"
          value={`${(portfolio?.completedPnLPercent ?? 0) >= 0 ? '+' : ''}${fmt(portfolio?.completedPnLPercent ?? 0)}%`}
          sub={`${portfolio?.totalTrades ?? 0} trades taken`}
          color={
            (portfolio?.completedPnLPercent ?? 0) >= 0
              ? 'text-emerald-400'
              : 'text-red-400'
          }
        />
        <StatCard
          icon={Activity}
          label="Win Rate"
          value={winRate === '—' ? '—' : `${winRate}%`}
          sub={`${portfolio?.winCount ?? 0}W / ${portfolio?.lossCount ?? 0}L`}
        />
        <StatCard
          icon={Trophy}
          label="Top Admin"
          value={topAdmin?.name ?? '—'}
          sub={topAdmin ? `${fmt(topAdmin.winRate, 1)}% win rate` : ''}
        />
      </div>

      {/* Active signals quick preview + Recent completions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active signals preview */}
        <div className="bg-[#131320] border border-white/6 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white text-sm font-semibold">
              Live Signals
            </span>
            <span className="text-emerald-400 text-xs font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md">
              {active.length} active
            </span>
          </div>
          {active.length === 0 ? (
            <p className="text-gray-500 text-sm py-6 text-center">
              No active signals right now
            </p>
          ) : (
            <div className="space-y-3">
              {active.slice(0, 5).map((sig) => (
                <div
                  key={sig.id}
                  className="flex items-center gap-3 p-3 bg-white/3 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      sig.direction === 'BUY'
                        ? 'bg-emerald-500/15'
                        : 'bg-red-500/15'
                    }`}
                  >
                    {sig.direction === 'BUY' ? (
                      <ArrowDownLeft size={14} className="text-emerald-400" />
                    ) : (
                      <ArrowUpRight size={14} className="text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">
                      {sig.asset}
                      <span className="text-gray-500 text-xs ml-1.5">
                        {sig.direction}
                      </span>
                    </p>
                    <p className="text-gray-500 text-xs">
                      Entry {fmt(sig.entryMin)} – {fmt(sig.entryMax)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 text-xs font-semibold">
                      TP +{fmt(sig.tpPercent, 1)}%
                    </p>
                    <p className="text-red-400 text-xs font-semibold">
                      SL -{fmt(sig.slPercent, 1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent completions */}
        <div className="bg-[#131320] border border-white/6 rounded-2xl p-5">
          <span className="text-white text-sm font-semibold">
            Recent Completions
          </span>
          {history.length === 0 ? (
            <p className="text-gray-500 text-sm py-6 text-center mt-2">
              No completed signals yet
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {history.slice(0, 6).map((sig) => (
                <div key={sig.id} className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      sig.status === 'TP_HIT'
                        ? 'bg-emerald-500/15'
                        : 'bg-red-500/15'
                    }`}
                  >
                    {sig.status === 'TP_HIT' ? (
                      <TrendingUp size={14} className="text-emerald-400" />
                    ) : (
                      <TrendingDown size={14} className="text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium">
                      {sig.asset}
                      <span className="text-gray-500 ml-1.5">
                        {sig.direction}
                      </span>
                    </p>
                    <p className="text-gray-500 text-xs">
                      {new Date(sig.createdAt).toLocaleDateString()} · by{' '}
                      {sig.admin?.name ?? 'Unknown'}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                      sig.status === 'TP_HIT'
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : sig.status === 'SL_HIT'
                          ? 'text-red-400 bg-red-500/10'
                          : 'text-gray-400 bg-white/5'
                    }`}
                  >
                    {sig.status === 'TP_HIT'
                      ? `+${fmt(sig.tpPercent, 1)}%`
                      : sig.status === 'SL_HIT'
                        ? `-${fmt(sig.slPercent, 1)}%`
                        : sig.status === 'EXPIRED'
                          ? 'Canceled'
                          : sig.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active portfolio trades */}
      {portfolio && portfolio.activeTrades.length > 0 && (
        <div className="bg-[#131320] border border-white/6 rounded-2xl p-5">
          <span className="text-white text-sm font-semibold">
            Floating Positions
          </span>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Asset', 'Direction', 'Entry', 'Current', 'P&L'].map(
                    (h) => (
                      <th
                        key={h}
                        className="pb-2.5 text-left text-gray-500 text-xs font-medium last:text-right"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {portfolio.activeTrades.map((t) => (
                  <tr
                    key={t.tradeId}
                    className="hover:bg-white/2 transition-colors"
                  >
                    <td className="py-3 text-white text-xs font-medium">
                      {t.asset}
                    </td>
                    <td className="py-3 text-gray-300 text-xs">{t.direction}</td>
                    <td className="py-3 text-gray-300 text-xs">
                      ${fmt(t.entryPrice)}
                    </td>
                    <td className="py-3 text-gray-300 text-xs">
                      {t.currentPrice ? `$${fmt(t.currentPrice)}` : '—'}
                    </td>
                    <td
                      className={`py-3 text-xs font-semibold text-right ${
                        t.floatingPnL >= 0
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }`}
                    >
                      {t.floatingPnL >= 0 ? '+' : ''}
                      {fmt(t.floatingPnL)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
