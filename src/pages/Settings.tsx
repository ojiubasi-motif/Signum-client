import { useState, useCallback } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import { api } from '../services/api';

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative rounded-full transition-all duration-200 flex-shrink-0 ${
        checked ? 'bg-emerald-600' : 'bg-white/15'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{ width: 40, height: 22 }}
    >
      <span
        className="absolute top-0.5 bg-white rounded-full shadow transition-all duration-200"
        style={{
          width: 18,
          height: 18,
          left: checked ? 20 : 2,
        }}
      />
    </button>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#131320] border border-white/6 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5">
        <h3 className="text-white text-sm font-semibold">{title}</h3>
      </div>
      <div className="divide-y divide-white/5">{children}</div>
    </div>
  );
}

function Row({
  label,
  sub,
  children,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4">
      <div>
        <p className="text-white text-sm">{label}</p>
        {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export default function Settings() {
  const member = useAppSelector((s) => s.auth.member);
  const [alertsEnabled, setAlertsEnabled] = useState(
    member?.alertsEnabled ?? true,
  );
  const [fcmToken, setFcmToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savePreferences = useCallback(
    async (updates: { alertsEnabled?: boolean; fcmToken?: string | null }) => {
      setSaving(true);
      setSaved(false);
      setError(null);
      try {
        await api.put('/members/preferences', updates);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to save');
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const handleToggleAlerts = (val: boolean) => {
    setAlertsEnabled(val);
    savePreferences({ alertsEnabled: val });
  };

  const handleSaveFcm = () => {
    savePreferences({ fcmToken: fcmToken.trim() || null });
  };

  const maskedPhone = member?.whatsappNumber
    ? `***${member.whatsappNumber.slice(-4)}`
    : '—';

  return (
    <div className="p-5 space-y-4 overflow-y-auto h-full max-w-3xl">
      {/* Status feedback */}
      {saved && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-in">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span className="text-emerald-300 text-sm">
            Preferences saved successfully
          </span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle size={16} className="text-red-400" />
          <span className="text-red-300 text-sm">{error}</span>
        </div>
      )}

      <Section title="Account">
        <Row label="WhatsApp Number" sub="Your registered identity">
          <span className="text-gray-300 text-sm font-mono">
            {maskedPhone}
          </span>
        </Row>
        <Row label="Member Since">
          <span className="text-gray-300 text-sm">
            {member?.joinedAt
              ? new Date(member.joinedAt).toLocaleDateString()
              : '—'}
          </span>
        </Row>
      </Section>

      <Section title="Notifications">
        <Row
          label="Signal Alerts"
          sub="Receive push notifications when new signals are posted"
        >
          <Toggle
            checked={alertsEnabled}
            onChange={handleToggleAlerts}
            disabled={saving}
          />
        </Row>
        <Row
          label="FCM Push Token"
          sub="Firebase Cloud Messaging token for web push notifications"
        >
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Paste FCM token..."
              value={fcmToken}
              onChange={(e) => setFcmToken(e.target.value)}
              className="bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 text-sm text-gray-300 placeholder-gray-500 outline-none flex-1 sm:w-48 focus:border-emerald-500/50 transition-colors"
            />
            <button
              onClick={handleSaveFcm}
              disabled={saving || !fcmToken.trim()}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 flex-shrink-0"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : null}
              Save
            </button>
          </div>
        </Row>
      </Section>

      <Section title="Preferences">
        <Row label="Theme" sub="Interface color scheme">
          <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
            {['Dark'].map((t) => (
              <button
                key={t}
                className="px-2.5 py-1 rounded text-xs font-medium bg-white/12 text-white"
              >
                {t}
              </button>
            ))}
          </div>
        </Row>
      </Section>
    </div>
  );
}
