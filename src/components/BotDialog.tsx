import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Bot, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: 'bot' | 'user';
  text: string;
}

interface BotDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Quick-action chips ───────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: '📋 Menu',           cmd: 'menu' },
  { label: '🟢 Active Signals', cmd: 'active' },
  { label: '📍 Open Signals',   cmd: 'open' },
  { label: '📜 History',        cmd: 'history' },
  { label: '📊 Stats',          cmd: 'stats' },
];

const CALC_HINT  = '📐 calc <entry> <tp%> <sl%>';
const PNL_HINT   = '💰 pnl <capital> <±%>';
const PRICE_HINT = '🔍 price <SYMBOL>';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert WhatsApp-style *bold* and _italic_ to plain readable text */
function renderBotText(raw: string): string {
  return raw
    .replace(/\*([^*]+)\*/g, '$1')    // bold markers → plain
    .replace(/_([^_]+)_/g, '$1');     // italic markers → plain
}

/** Parse free-form text input into an API call */
async function runTextCommand(text: string): Promise<string> {
  const t = text.trim();
  const lower = t.toLowerCase();

  // price BTC
  const priceM = lower.match(/^price\s+([a-z0-9]{1,10})$/i);
  if (priceM) {
    const data = await api.get<{ result: string }>(
      `/members/bot/query?cmd=price&sym=${encodeURIComponent(priceM[1])}`,
    );
    return data.result;
  }

  // calc 60000 2 1
  const calcM = lower.match(/^calc\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)$/);
  if (calcM) {
    const data = await api.get<{ result: string }>(
      `/members/bot/query?cmd=calc&entry=${encodeURIComponent(calcM[1])}&tp=${encodeURIComponent(calcM[2])}&sl=${encodeURIComponent(calcM[3])}`,
    );
    return data.result;
  }

  // pnl 1000 5.5
  const pnlM = lower.match(/^pnl\s+([\d.]+)\s+(-?[\d.]+)$/);
  if (pnlM) {
    const data = await api.get<{ result: string }>(
      `/members/bot/query?cmd=pnl&capital=${encodeURIComponent(pnlM[1])}&pct=${encodeURIComponent(pnlM[2])}`,
    );
    return data.result;
  }

  // keyword commands
  const KEYWORD_MAP: Record<string, string> = {
    menu: 'menu', hi: 'menu', hello: 'menu', start: 'menu', help: 'menu',
    active: 'active', open: 'open',
    history: 'history', expired: 'history', closed: 'history',
    stats: 'history',
  };
  const mapped = KEYWORD_MAP[lower];
  if (mapped) {
    const data = await api.get<{ result: string }>(`/members/bot/query?cmd=${mapped}`);
    return data.result;
  }

  return `❓ Unknown command. Type "menu" to see all available commands.\n\nQuick tips:\n• ${PRICE_HINT}\n• ${CALC_HINT}\n• ${PNL_HINT}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BotDialog({ isOpen, onClose }: BotDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input and send welcome menu when dialog opens
  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    if (messages.length === 0) {
      sendCommand('menu');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const sendCommand = useCallback(async (cmd: string, displayText?: string) => {
    const userText = displayText ?? cmd;

    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      let result: string;

      if (['menu', 'active', 'open', 'history', 'stats'].includes(cmd)) {
        const data = await api.get<{ result: string }>(`/members/bot/query?cmd=${cmd}`);
        result = data.result;
      } else {
        result = await runTextCommand(cmd);
      }

      setMessages(prev => [...prev, { role: 'bot', text: result }]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { role: 'bot', text: '⚠️ Failed to reach Signum. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim().slice(0, 200); // client-side cap mirrors server
    if (!trimmed || loading) return;
    setInput('');
    sendCommand(trimmed, trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Signum Bot"
        className="fixed bottom-20 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl border border-white/10 bg-[#0f0f1e] shadow-2xl shadow-black/60 overflow-hidden"
        style={{ maxHeight: '520px' }}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#13132a] border-b border-white/8">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Bot size={16} className="text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Signum Bot</p>
            <p className="text-xs text-emerald-400">● Online</p>
          </div>
          <button
            id="bot-dialog-close"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close bot dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-[200px]">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words ${
                  msg.role === 'user'
                    ? 'bg-emerald-600/80 text-white rounded-br-sm'
                    : 'bg-[#1e1e38] text-gray-200 rounded-bl-sm border border-white/6'
                }`}
              >
                {/* Security: textContent via React JSX — no dangerouslySetInnerHTML */}
                {renderBotText(msg.text)}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#1e1e38] border border-white/6 rounded-xl rounded-bl-sm px-3 py-2">
                <Loader2 size={14} className="text-emerald-400 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick-action chips */}
        <div className="flex gap-1.5 px-3 py-2 flex-wrap border-t border-white/6 bg-[#0f0f1e]">
          {QUICK_ACTIONS.map(({ label, cmd }) => (
            <button
              key={cmd}
              id={`bot-chip-${cmd}`}
              onClick={() => sendCommand(cmd, label)}
              disabled={loading}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-white/6 hover:bg-emerald-600/30 text-gray-300 hover:text-emerald-300 border border-white/8 hover:border-emerald-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {label}
              <ChevronRight size={8} />
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 px-3 py-3 border-t border-white/8 bg-[#13132a]"
        >
          <input
            id="bot-dialog-input"
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value.slice(0, 200))}
            placeholder={`${PRICE_HINT} | ${CALC_HINT}`}
            disabled={loading}
            className="flex-1 min-w-0 bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 disabled:opacity-40"
            autoComplete="off"
            spellCheck="false"
          />
          <button
            id="bot-dialog-send"
            type="submit"
            disabled={!input.trim() || loading}
            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
            aria-label="Send message"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </>
  );
}
