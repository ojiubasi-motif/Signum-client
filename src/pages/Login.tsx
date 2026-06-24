import { useState, type FormEvent } from 'react';
import { Zap, Loader2, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { requestOtp, verifyOtp, clearError, resetLoginFlow } from '../store/slices/authSlice';

export default function Login() {
  const dispatch = useAppDispatch();
  const { loading, error, step, whatsappNumber } = useAppSelector((s) => s.auth);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');

  const handlePhoneSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 7 || cleaned.length > 15) return;
    dispatch(requestOtp(cleaned));
  };

  const handleOtpSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanedCode = code.replace(/\D/g, '');
    if (cleanedCode.length !== 6 || !whatsappNumber) return;
    dispatch(verifyOtp({ whatsappNumber, code: cleanedCode }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a14] px-4">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Zap size={22} className="text-white fill-white" />
          </div>
          <span className="text-white text-2xl font-bold tracking-tight">
            Signum
          </span>
        </div>

        {/* Card */}
        <div className="bg-[#131320] border border-white/6 rounded-2xl p-8 backdrop-blur-xl">
          {step === 'phone' ? (
            <>
              <h1 className="text-white text-xl font-semibold text-center mb-1">
                Welcome back
              </h1>
              <p className="text-gray-400 text-sm text-center mb-8">
                Enter your WhatsApp number to continue
              </p>

              <form onSubmit={handlePhoneSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="login-phone"
                    className="text-gray-400 text-xs font-medium mb-2 block"
                  >
                    WhatsApp Number
                  </label>
                  <div className="flex items-center bg-white/5 border border-white/8 rounded-xl px-4 py-3 focus-within:border-emerald-500/50 transition-colors">
                    <span className="text-gray-500 text-sm mr-2 select-none">+</span>
                    <input
                      id="login-phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="234 812 345 6789"
                      value={phone}
                      onChange={(e) => {
                        dispatch(clearError());
                        setPhone(e.target.value);
                      }}
                      className="bg-transparent text-white text-sm outline-none flex-1 placeholder-gray-500"
                      autoComplete="tel"
                      maxLength={20}
                      required
                    />
                  </div>
                  <p className="text-gray-500 text-xs mt-2">
                    Digits only, country code included (e.g. 2348123456789)
                  </p>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-red-300 text-sm">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || phone.replace(/\D/g, '').length < 7}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending OTP…
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-6">
                <button
                  onClick={() => dispatch(resetLoginFlow())}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <ArrowLeft size={16} />
                </button>
                <span className="text-gray-400 text-xs font-medium">Change Phone Number</span>
              </div>

              <h1 className="text-white text-xl font-semibold text-center mb-1">
                Verify your identity
              </h1>
              <p className="text-gray-400 text-sm text-center mb-8">
                Enter the 6-digit code sent to WhatsApp DM for <span className="text-emerald-400 font-medium">+{whatsappNumber}</span>
              </p>

              <form onSubmit={handleOtpSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="login-code"
                    className="text-gray-400 text-xs font-medium mb-2 block"
                  >
                    6-Digit Verification Code
                  </label>
                  <div className="flex items-center bg-white/5 border border-white/8 rounded-xl px-4 py-3 focus-within:border-emerald-500/50 transition-colors">
                    <KeyRound size={16} className="text-gray-500 mr-2 flex-shrink-0" />
                    <input
                      id="login-code"
                      type="text"
                      inputMode="numeric"
                      placeholder="123456"
                      value={code}
                      onChange={(e) => {
                        dispatch(clearError());
                        setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                      }}
                      className="bg-transparent text-white text-sm outline-none flex-1 placeholder-gray-500 tracking-widest text-center font-mono text-lg"
                      maxLength={6}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-red-300 text-sm">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || code.replace(/\D/g, '').length !== 6}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    'Verify & Login'
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-gray-600 text-xs text-center mt-6">
          By continuing you agree to Signum's terms of service.
        </p>
      </div>
    </div>
  );
}
