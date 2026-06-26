/* ─── Navigation ───────────────────────────────────────────────── */
export type Page =
  | 'dashboard'
  | 'signals'
  | 'portfolio'
  | 'leaderboard'
  | 'settings';

/* ─── Backend API Types (mirror Prisma models) ─────────────────── */

export interface Admin {
  id: string;         // WhatsApp number
  name: string;
  winRate: number;
  totalSignals: number;
  totalWins: number;
}

export type SignalStatus =
  | 'PENDING'
  | 'ENTRY_OPEN'
  | 'ENTRY_MISSED'
  | 'TP_HIT'
  | 'SL_HIT'
  | 'EXPIRED';

export interface Signal {
  id: string;
  messageId: string | null;
  adminId: string;
  asset: string;
  direction: 'BUY' | 'SELL';
  entryMin: number;
  entryMax: number;
  tpPercent: number;
  slPercent: number;
  tpPrice: number;
  slPrice: number;
  rrRatio: number;
  urgencyScore: number;
  status: SignalStatus;
  rawText: string;
  enrichment: Record<string, unknown> | null;
  livePriceAtPost: number | null;
  coingeckoId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  admin: Admin;
}

export interface Member {
  id: string;
  whatsappNumber: string;
  alertsEnabled: boolean;
  fcmToken?: string | null;
  joinedAt: string;
}

export interface AuthResponse {
  access_token: string;
  member: Member;
}

/* ─── Portfolio ─────────────────────────────────────────────────── */

export interface CompletedTrade {
  tradeId: string;
  signalId: string;
  asset: string;
  direction: string;
  status: SignalStatus;
  outcome: string | null;
  tpPercent: number;
  slPercent: number;
  takenAt: string;
  resolvedAt: string | null;
}

export interface ActiveTrade {
  tradeId: string;
  signalId: string;
  asset: string;
  direction: string;
  status: SignalStatus;
  entryPrice: number;
  currentPrice: number | null;
  floatingPnL: number;
  takenAt: string;
}

export interface PortfolioResponse {
  totalTrades: number;
  winCount: number;
  lossCount: number;
  missedCount: number;
  canceledCount: number;
  completedPnLPercent: number;
  completedTrades: CompletedTrade[];
  activeTrades: ActiveTrade[];
}

/* ─── UI Chart helpers (kept for dashboard sparklines) ──────────── */

export interface ChartDataPoint {
  date: string;
  value: number;
}
