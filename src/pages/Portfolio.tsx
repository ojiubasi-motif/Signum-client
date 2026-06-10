import { useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  Briefcase,
  Trophy,
  AlertCircle,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchPortfolio } from '../store/slices/portfolioSlice';

function fmt(n: number, d = 2) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

export default function Portfolio() {
  const dispatch = useAppDispatch();
  const member = useAppSelector((s) => s.auth.member);
  const { data: portfolio, loading, error } = useAppSelector(
    (s) => s.portfolio,
  );

  useEffect(() => {
    if (member?.id) {
      dispatch(fetchPortfolio(member.id));
    }
  }, [dispatch, member?.id]);

  if (loading && !portfolio) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={32} className="text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-red-400 text-sm">
        <AlertCircle size={16} />
        {error}
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <Briefcase size={48} className="text-gray-600 mb-4" />
        <p className="text-gray-400 text-sm">
          Your portfolio is empty. Take your first trade from the Signals page!
        </p>
      </div>
    );
  }

  const winRate =
    portfolio.winCount + portfolio.lossCount > 0
      ? (
          (portfolio.winCount / (portfolio.winCount + portfolio.lossCount)) *
          100
        ).toFixed(1)
      : '—';

  const floatingTotal = portfolio.activeTrades.reduce(
    (sum, t) => sum + t.floatingPnL,
    0,
  );

  return (
    <div className="p-5 space-y-4 overflow-y-auto h-full">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#131320] border border-white/6 rounded-2xl p-5">
          <p className="text-gray-400 text-xs mb-1">Completed P&L</p>
          <p
            className={`text-2xl font-bold tracking-tight ${
              portfolio.completedPnLPercent >= 0
                ? 'text-emerald-400'
                : 'text-red-400'
            }`}
          >
            {portfolio.completedPnLPercent >= 0 ? '+' : ''}
            {fmt(portfolio.completedPnLPercent)}%
          </p>
        </div>
        <div className="bg-[#131320] border border-white/6 rounded-2xl p-5">
          <p className="text-gray-400 text-xs mb-1">Win Rate</p>
          <p className="text-white text-2xl font-bold tracking-tight">
            {winRate === '—' ? '—' : `${winRate}%`}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {portfolio.winCount}W / {portfolio.lossCount}L /{' '}
            {portfolio.missedCount}M
          </p>
        </div>
        <div className="bg-[#131320] border border-white/6 rounded-2xl p-5">
          <p className="text-gray-400 text-xs mb-1">Total Trades</p>
          <p className="text-white text-2xl font-bold tracking-tight">
            {portfolio.totalTrades}
          </p>
        </div>
        <div className="bg-[#131320] border border-white/6 rounded-2xl p-5">
          <p className="text-gray-400 text-xs mb-1">Floating P&L</p>
          <p
            className={`text-2xl font-bold tracking-tight ${
              floatingTotal >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {floatingTotal >= 0 ? '+' : ''}
            {fmt(floatingTotal)}%
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {portfolio.activeTrades.length} active position
            {portfolio.activeTrades.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Active trades */}
      {portfolio.activeTrades.length > 0 && (
        <div className="bg-[#131320] border border-white/6 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white text-sm font-semibold">
              Active Positions
            </span>
            <span className="text-emerald-400 text-xs font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md">
              {portfolio.activeTrades.length} open
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Asset', 'Direction', 'Entry', 'Current Price', 'Floating P&L', 'Taken At'].map(
                  (h) => (
                    <th
                      key={h}
                      className="pb-3 text-left text-gray-500 text-xs font-medium last:text-right"
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
                  className="group hover:bg-white/2 transition-colors"
                >
                  <td className="py-4">
                    <span className="text-white text-sm font-medium">
                      {t.asset}
                    </span>
                  </td>
                  <td className="py-4">
                    <span
                      className={`text-xs font-semibold uppercase ${
                        t.direction === 'BUY'
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }`}
                    >
                      {t.direction}
                    </span>
                  </td>
                  <td className="py-4 text-gray-300 text-sm">
                    ${fmt(t.entryPrice)}
                  </td>
                  <td className="py-4 text-white text-sm font-medium">
                    {t.currentPrice ? `$${fmt(t.currentPrice)}` : '—'}
                  </td>
                  <td className="py-4">
                    <span
                      className={`text-sm font-semibold flex items-center gap-1 ${
                        t.floatingPnL >= 0
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }`}
                    >
                      {t.floatingPnL >= 0 ? (
                        <TrendingUp size={12} />
                      ) : (
                        <TrendingDown size={12} />
                      )}
                      {t.floatingPnL >= 0 ? '+' : ''}
                      {fmt(t.floatingPnL)}%
                    </span>
                  </td>
                  <td className="py-4 text-gray-500 text-xs text-right">
                    {new Date(t.takenAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}

      {/* Completed trades */}
      <div className="bg-[#131320] border border-white/6 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white text-sm font-semibold">
            Completed Trades
          </span>
          <span className="text-gray-400 text-xs">
            {portfolio.completedTrades.length} total
          </span>
        </div>

        {portfolio.completedTrades.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Trophy size={36} className="text-gray-600 mb-3" />
            <p className="text-gray-500 text-sm">
              No completed trades yet
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Asset', 'Direction', 'Outcome', 'P&L', 'Taken', 'Resolved'].map(
                  (h) => (
                    <th
                      key={h}
                      className="pb-3 text-left text-gray-500 text-xs font-medium last:text-right"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {portfolio.completedTrades.map((t) => (
                <tr
                  key={t.tradeId}
                  className="group hover:bg-white/2 transition-colors"
                >
                  <td className="py-3 text-white text-xs font-medium">
                    {t.asset}
                  </td>
                  <td className="py-3">
                    <span
                      className={`text-xs font-semibold uppercase ${
                        t.direction === 'BUY'
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }`}
                    >
                      {t.direction}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                        t.outcome === 'WIN'
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : t.outcome === 'LOSS'
                            ? 'text-red-400 bg-red-500/10'
                            : 'text-gray-400 bg-white/5'
                      }`}
                    >
                      {t.outcome ?? 'PENDING'}
                    </span>
                  </td>
                  <td
                    className={`py-3 text-xs font-semibold ${
                      t.status === 'TP_HIT'
                        ? 'text-emerald-400'
                        : t.status === 'SL_HIT'
                          ? 'text-red-400'
                          : 'text-gray-400'
                    }`}
                  >
                    {t.status === 'TP_HIT'
                      ? `+${fmt(t.tpPercent, 1)}%`
                      : t.status === 'SL_HIT'
                        ? `-${fmt(t.slPercent, 1)}%`
                        : '—'}
                  </td>
                  <td className="py-3 text-gray-500 text-xs">
                    {new Date(t.takenAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-gray-500 text-xs text-right">
                    {t.resolvedAt
                      ? new Date(t.resolvedAt).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
}
