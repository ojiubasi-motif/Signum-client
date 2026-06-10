import { useEffect } from 'react';
import { Loader2, Trophy, TrendingUp, Radio } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchAdminStats } from '../store/slices/adminsSlice';

function fmt(n: number, d = 1) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

const rankColors = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];
const rankBgs = [
  'bg-yellow-400/10 border-yellow-500/20',
  'bg-white/5 border-white/8',
  'bg-amber-500/10 border-amber-500/20',
];

export default function Leaderboard() {
  const dispatch = useAppDispatch();
  const { list: admins, loading } = useAppSelector((s) => s.admins);

  useEffect(() => {
    dispatch(fetchAdminStats());
  }, [dispatch]);

  if (loading && admins.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={32} className="text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (admins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <Trophy size={48} className="text-gray-600 mb-4" />
        <p className="text-gray-400 text-sm">
          No admins found. Signal posting admins and their stats will appear
          here.
        </p>
      </div>
    );
  }

  const totalSignals = admins.reduce((s, a) => s + a.totalSignals, 0);
  const avgWinRate =
    admins.length > 0
      ? admins.reduce((s, a) => s + a.winRate, 0) / admins.length
      : 0;

  return (
    <div className="p-5 space-y-4 overflow-y-auto h-full">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#131320] border border-white/6 rounded-2xl p-5">
          <p className="text-gray-400 text-xs mb-1">Total Admins</p>
          <p className="text-white text-2xl font-bold tracking-tight">
            {admins.length}
          </p>
        </div>
        <div className="bg-[#131320] border border-white/6 rounded-2xl p-5">
          <p className="text-gray-400 text-xs mb-1">Total Signals Posted</p>
          <p className="text-white text-2xl font-bold tracking-tight">
            {totalSignals}
          </p>
        </div>
        <div className="bg-[#131320] border border-white/6 rounded-2xl p-5">
          <p className="text-gray-400 text-xs mb-1">Average Win Rate</p>
          <p className="text-emerald-400 text-2xl font-bold tracking-tight">
            {fmt(avgWinRate)}%
          </p>
        </div>
      </div>

      {/* Podium top 3 */}
      {admins.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {admins.slice(0, 3).map((admin, i) => (
            <div
              key={admin.id}
              className={`rounded-2xl p-5 border ${rankBgs[i]} flex flex-col items-center text-center`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-3 ${
                  i === 0
                    ? 'bg-yellow-400/20 text-yellow-400'
                    : i === 1
                      ? 'bg-white/10 text-gray-300'
                      : 'bg-amber-500/20 text-amber-500'
                }`}
              >
                #{i + 1}
              </div>
              <p className={`text-sm font-semibold mb-1 ${rankColors[i]}`}>
                {admin.name}
              </p>
              <p className="text-emerald-400 text-lg font-bold">
                {fmt(admin.winRate)}%
              </p>
              <p className="text-gray-500 text-xs mt-1">
                {admin.totalWins}W / {admin.totalSignals} signals
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Full table */}
      <div className="bg-[#131320] border border-white/6 rounded-2xl p-5">
        <span className="text-white text-sm font-semibold">
          All Admins
        </span>
        <div className="overflow-x-auto">
          <table className="w-full text-sm mt-4">
          <thead>
            <tr className="border-b border-white/5">
              {['Rank', 'Admin', 'Win Rate', 'Wins', 'Total Signals'].map(
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
            {admins.map((admin, idx) => (
              <tr
                key={admin.id}
                className="group hover:bg-white/2 transition-colors"
              >
                <td className="py-4">
                  <span
                    className={`text-sm font-bold ${
                      idx < 3
                        ? rankColors[idx]
                        : 'text-gray-500'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/20 flex items-center justify-center text-white text-xs font-bold">
                      {admin.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white text-sm font-medium">
                      {admin.name}
                    </span>
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${Math.min(admin.winRate, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-emerald-400 text-sm font-semibold">
                      {fmt(admin.winRate)}%
                    </span>
                  </div>
                </td>
                <td className="py-4">
                  <span className="text-white text-sm flex items-center gap-1">
                    <TrendingUp size={12} className="text-emerald-400" />
                    {admin.totalWins}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <span className="text-gray-300 text-sm flex items-center gap-1 justify-end">
                    <Radio size={12} className="text-gray-500" />
                    {admin.totalSignals}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
}
