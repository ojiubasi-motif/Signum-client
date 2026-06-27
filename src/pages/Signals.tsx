import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  X,
  Target,
  Shield,
  Zap,
  Clock,
  CheckCircle2,
  Radio,
  AlertTriangle,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchActiveSignals, fetchSignalHistory } from '../store/slices/signalsSlice';
import { takeTrade } from '../store/slices/portfolioSlice';
import type { Signal } from '../types';

function fmt(n: number, d = 2) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

function fmtPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return '';
  if (price === 0) return '0.0000';
  
  const sigStr = price.toPrecision(4);
  if (!sigStr.includes('e')) {
    return sigStr;
  }
  
  const val = Number(sigStr);
  const exponent = parseInt(sigStr.split('e')[1], 10);
  
  if (Math.abs(val) >= 1) {
    const decimals = Math.max(0, 3 - exponent);
    return val.toFixed(decimals);
  }
  
  const decimals = 3 - exponent;
  return val.toFixed(decimals);
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    ENTRY_OPEN: {
      label: 'Entry Open',
      cls: 'text-emerald-400 bg-emerald-500/10',
    },
    PENDING: { label: 'Pending', cls: 'text-yellow-400 bg-yellow-500/10' },
    TP_HIT: { label: 'TP Hit ✓', cls: 'text-emerald-400 bg-emerald-500/10' },
    SL_HIT: { label: 'SL Hit ✗', cls: 'text-red-400 bg-red-500/10' },
    ENTRY_MISSED: {
      label: 'Missed',
      cls: 'text-gray-400 bg-white/5',
    },
    EXPIRED: { label: 'Canceled', cls: 'text-gray-400 bg-white/5' },
  };
  const m = map[status] ?? { label: status, cls: 'text-gray-400 bg-white/5' };
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-md ${m.cls}`}
    >
      {m.label}
    </span>
  );
}

function SignalCard({
  signal,
  onTakeTrade,
  taking,
}: {
  signal: Signal;
  onTakeTrade: (id: string) => void;
  taking: boolean;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const isBuy = signal.direction === 'BUY';
  const isActive = ['ENTRY_OPEN', 'PENDING'].includes(signal.status);

  return (
    <>
      <div
        className="bg-[#131320] border border-white/6 rounded-2xl p-5 hover:border-white/12 transition-all cursor-pointer group"
        onClick={() => setShowDetail(true)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isBuy ? 'bg-emerald-500/15' : 'bg-red-500/15'
              }`}
            >
              {isBuy ? (
                <ArrowDownLeft size={18} className="text-emerald-400" />
              ) : (
                <ArrowUpRight size={18} className="text-red-400" />
              )}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">
                {signal.asset}
                <span className="text-gray-500 text-xs ml-1.5 font-normal">
                  {signal.direction}
                </span>
              </p>
              <p className="text-gray-500 text-xs">
                by {signal.admin?.name ?? 'Unknown'}
              </p>
            </div>
          </div>
          {statusBadge(signal.status)}
        </div>

        {/* Market data unavailability notice */}
        {signal.marketUnavailable && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 mb-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <AlertTriangle size={12} className="text-amber-400 shrink-0" />
            <span className="text-amber-400 text-xs">Market data unavailable — monitor manually</span>
          </div>
        )}
        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/3 rounded-lg p-2.5 text-center">
            <p className="text-gray-500 text-xs mb-0.5">Entry Zone</p>
            <p className="text-white text-xs font-medium">
              ${fmtPrice(signal.entryMin)} – ${fmtPrice(signal.entryMax)}
            </p>
          </div>
          <div className="bg-white/3 rounded-lg p-2.5 text-center">
            <p className="text-gray-500 text-xs mb-0.5">Take Profit</p>
            <p className="text-emerald-400 text-xs font-semibold">
              ${fmtPrice(signal.tpPrice)} (+{fmt(signal.tpPercent, 1)}%)
            </p>
          </div>
          <div className="bg-white/3 rounded-lg p-2.5 text-center">
            <p className="text-gray-500 text-xs mb-0.5">Stop Loss</p>
            <p className="text-red-400 text-xs font-semibold">
              ${fmtPrice(signal.slPrice)} (-{fmt(signal.slPercent, 1)}%)
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Target size={11} />
              RR {fmt(signal.rrRatio, 1)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {new Date(signal.createdAt).toLocaleDateString()}
            </span>
          </div>
          {isActive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTakeTrade(signal.id);
              }}
              disabled={taking}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all"
            >
              {taking ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <CheckCircle2 size={12} />
              )}
              Take Trade
            </button>
          )}
        </div>
      </div>

      {/* Detail overlay */}
      {showDetail && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowDetail(false)}
        >
          <div
            className="bg-[#131320] border border-white/8 rounded-2xl w-full max-w-lg p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowDetail(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isBuy ? 'bg-emerald-500/15' : 'bg-red-500/15'
                }`}
              >
                {isBuy ? (
                  <ArrowDownLeft size={22} className="text-emerald-400" />
                ) : (
                  <ArrowUpRight size={22} className="text-red-400" />
                )}
              </div>
              <div>
                <h2 className="text-white text-lg font-semibold">
                  {signal.asset}{' '}
                  <span className="text-gray-400 text-sm font-normal">
                    {signal.direction}
                  </span>
                </h2>
                <p className="text-gray-500 text-sm">
                  Posted by {signal.admin?.name ?? 'Unknown'} ·{' '}
                  {new Date(signal.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Market data unavailability notice */}
            {signal.marketUnavailable && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <AlertTriangle size={12} className="text-amber-400 shrink-0" />
                <span className="text-amber-400 text-xs">Market data unavailable — monitor manually</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                {
                  icon: Target,
                  label: 'Entry Zone',
                  value: `$${fmtPrice(signal.entryMin)} – $${fmtPrice(signal.entryMax)}`,
                },
                {
                  icon: Zap,
                  label: 'Live at Post',
                  value: signal.livePriceAtPost
                    ? `$${fmtPrice(signal.livePriceAtPost)}`
                    : '—',
                },
                {
                  icon: Target,
                  label: 'Take Profit',
                  value: `$${fmtPrice(signal.tpPrice)} (+${fmt(signal.tpPercent, 1)}%)`,
                  cls: 'text-emerald-400',
                },
                {
                  icon: Shield,
                  label: 'Stop Loss',
                  value: `$${fmtPrice(signal.slPrice)} (-${fmt(signal.slPercent, 1)}%)`,
                  cls: 'text-red-400',
                },
              ].map(({ icon: Icon, label, value, cls }) => (
                <div key={label} className="bg-white/3 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={12} className="text-gray-500" />
                    <span className="text-gray-500 text-xs">{label}</span>
                  </div>
                  <p
                    className={`text-sm font-medium ${cls ?? 'text-white'}`}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-400 mb-5">
              <span>RR Ratio: {fmt(signal.rrRatio, 2)}</span>
              <span>Urgency: {signal.urgencyScore}/10</span>
              <span>Status: {signal.status}</span>
            </div>

            {/* AI enrichment */}
            {signal.enrichment && (
              <div className="bg-white/3 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Zap size={12} className="text-emerald-400" />
                  <span className="text-emerald-400 text-xs font-semibold">
                    AI Analysis
                  </span>
                </div>
                <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap">
                  {typeof signal.enrichment === 'object'
                    ? JSON.stringify(signal.enrichment, null, 2)
                    : String(signal.enrichment)}
                </p>
              </div>
            )}

            {/* Raw text */}
            <div className="bg-white/3 rounded-xl p-4">
              <span className="text-gray-500 text-xs mb-2 block">
                Original Signal Text
              </span>
              <p className="text-gray-300 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                {signal.rawText}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type Tab = 'active' | 'history';

export default function Signals() {
  const dispatch = useAppDispatch();
  const { active, history, loadingActive, loadingHistory } = useAppSelector(
    (s) => s.signals,
  );
  const { takingTradeId } = useAppSelector((s) => s.portfolio);
  const [tab, setTab] = useState<Tab>('active');

  useEffect(() => {
    dispatch(fetchActiveSignals());
    dispatch(fetchSignalHistory());
  }, [dispatch]);

  const handleTakeTrade = (signalId: string) => {
    dispatch(takeTrade(signalId));
  };

  const signals = tab === 'active' ? active : history;
  const loading = tab === 'active' ? loadingActive : loadingHistory;

  return (
    <div className="p-5 space-y-4 overflow-y-auto h-full">
      {/* Tabs */}
      <div className="flex items-center gap-4">
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
          {(
            [
              { key: 'active', label: `Active (${active.length})` },
              { key: 'history', label: `History (${history.length})` },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === key
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && signals.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="text-emerald-400 animate-spin" />
        </div>
      ) : signals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Radio size={48} className="text-gray-600 mb-4" />
          <p className="text-gray-400 text-sm">
            {tab === 'active'
              ? 'No active signals right now. New signals from your admin group will appear here.'
              : 'No signal history yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {signals.map((sig) => (
            <SignalCard
              key={sig.id}
              signal={sig}
              onTakeTrade={handleTakeTrade}
              taking={takingTradeId === sig.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
