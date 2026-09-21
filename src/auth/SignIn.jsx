import { useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { DEMO_PRESETS } from "./adapters/demo.js";

export function SignIn() {
  const { signIn, signUp, resetPassword, insecure } = useAuth();
  const [mode, setMode] = useState("signin"); // "signin" | "register" | "forgot"

  // Sign in state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regCompany, setRegCompany] = useState("");
  const [regRole, setRegRole] = useState("Marketing Lead");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Feedback states
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [pending, setPending] = useState(false);

  const calculateStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = calculateStrength(regPassword);

  const handleSignIn = async (e) => {
    e?.preventDefault();
    setPending(true);
    setError("");
    setSuccessMsg("");
    try {
      await signIn({ email, password, rememberMe });
    } catch (err) {
      setError(err.message || "Sign-in failed. Please verify credentials.");
    } finally {
      setPending(false);
    }
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!regName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!regEmail.trim()) {
      setError("Please enter your work email.");
      return;
    }
    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreeTerms) {
      setError("Please agree to the Terms of Service.");
      return;
    }

    setPending(true);
    try {
      await signUp({
        name: regName,
        email: regEmail,
        password: regPassword,
        company: regCompany,
        role: regRole,
        rememberMe,
      });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const handleForgot = async (e) => {
    e?.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!forgotEmail.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setPending(true);
    try {
      await resetPassword({ email: forgotEmail, newPassword: forgotNewPassword || "password123" });
      setForgotSuccess(true);
      setSuccessMsg(`Password reset successfully! You can now log in with your email.`);
      setEmail(forgotEmail);
      setPassword(forgotNewPassword || "password123");
    } catch (err) {
      setError(err.message || "Could not reset password.");
    } finally {
      setPending(false);
    }
  };

  const quickDemoLogin = (preset) => {
    setEmail(preset.email);
    setPassword(preset.password);
    setError("");
    setSuccessMsg("");
    signIn({ email: preset.email, password: preset.password, rememberMe: true });
  };

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-slate-950 font-sans overflow-y-auto">
      {/* Cool Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brandPink/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-brandCyan/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-brandPurple/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphism Auth Card */}
      <div className="relative z-10 w-full max-w-5xl rounded-3xl bg-white/95 backdrop-blur-xl shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* LEFT PANEL: Showcase & Intelligence Hub */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#090D16] p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />

          {/* Top Logo & Branding */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FA2E76] via-[#FF5388] to-[#7B61FF] text-white shadow-glow-pink">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div>
                <span className="font-display text-2xl font-black tracking-tight text-white flex items-center gap-1">
                  OmniScope<span className="text-brandPink">.</span>
                </span>
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase block">
                  Enterprise Marketing Suite
                </span>
              </div>
            </div>

            {/* Headline */}
            <div className="mt-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-brandPink border border-white/10 mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-brandPink animate-pulse" />
                Unified Revenue & SEO Intelligence
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight text-white tracking-tight">
                Turn scattered spreadsheets into live revenue insights.
              </h1>
              <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Connect weekly SEO tracking, multi-channel email campaigns, software SaaS costs, and conversion funnels in one place.
              </p>
            </div>

            {/* Live Snapshot Cards */}
            <div className="mt-7 space-y-3">
              {/* Snapshot 1: SEO */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm hover:border-brandCyan/40 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                        <polyline points="16 7 22 7 22 13" />
                      </svg>
                    </span>
                    <span className="text-xs font-semibold text-slate-200">Weekly SEO & GA4 Matrix</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">Live</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-black/20 p-2">
                    <div className="text-[10px] text-slate-400">Tecnoprism</div>
                    <div className="font-display font-bold text-slate-100 mt-0.5">64,002 views</div>
                    <div className="text-[9px] text-cyan-400">45 verified weeks</div>
                  </div>
                  <div className="rounded-lg bg-black/20 p-2">
                    <div className="text-[10px] text-slate-400">Automation CoE</div>
                    <div className="font-display font-bold text-slate-100 mt-0.5">7,150 views</div>
                    <div className="text-[9px] text-cyan-400">10 verified weeks</div>
                  </div>
                </div>
              </div>

              {/* Snapshot 2: Email & Costs */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm hover:border-brandPink/40 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/20 text-pink-400">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Email Campaign Intel</div>
                    <div className="text-[10px] text-slate-400">99.4% Delivery · 38.7% Open Rate</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-pink-400 font-display">12 Active</span>
              </div>
            </div>
          </div>

          {/* Bottom Security Guarantee */}
          <div className="relative z-10 mt-8 pt-5 border-t border-slate-800/80 flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            <p className="text-[11px] text-slate-400 leading-snug">
              <strong className="text-slate-300 font-semibold">100% In-Browser Privacy:</strong> All Excel & CSV files are computed client-side in memory and never uploaded to any remote server.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL: Interactive Login / Register Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white">
          <div>
            {/* Top Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setMode("signin"); setError(""); setSuccessMsg(""); }}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    mode === "signin"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("register"); setError(""); setSuccessMsg(""); }}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    mode === "register"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Forgot link shortcut */}
              {mode !== "forgot" && (
                <button
                  type="button"
                  onClick={() => { setMode("forgot"); setError(""); setSuccessMsg(""); }}
                  className="text-xs text-slate-500 hover:text-brandPink transition-colors cursor-pointer font-medium"
                >
                  Forgot password?
                </button>
              )}
            </div>

            {/* Quick Demo Access Pills */}
            <div className="mt-5 rounded-2xl bg-gradient-to-r from-slate-50 to-pink-50/40 p-3.5 border border-slate-200/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-amber-500">⚡</span> 1-Click Instant Demo Access
                </span>
                <span className="text-[10px] text-slate-400">No registration required</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DEMO_PRESETS.map((p) => (
                  <button
                    key={p.email}
                    type="button"
                    onClick={() => quickDemoLogin(p)}
                    className="group text-left p-2 rounded-xl bg-white border border-slate-200/80 hover:border-brandPink hover:shadow-xs transition-all cursor-pointer"
                  >
                    <div className="text-[11px] font-bold text-slate-800 group-hover:text-brandPink truncate">{p.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{p.badge}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ERROR & SUCCESS ALERTS */}
            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>{successMsg}</span>
              </div>
            )}

            {/* FORM: MODE 1 - SIGN IN */}
            {mode === "signin" && (
              <form className="mt-6 space-y-4" onSubmit={handleSignIn} noValidate>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="login-email">
                    Work Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="username"
                      required
                      placeholder="e.g. yash.prajapati@tecnoprism.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="field w-full pl-10 pr-4 py-2.5 bg-slate-50/60 focus:bg-white text-slate-800 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="login-password">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="field w-full pl-10 pr-10 py-2.5 bg-slate-50/60 focus:bg-white text-slate-800 text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-brandPink focus:ring-brandPink"
                    />
                    <span>Remember me on this browser</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={pending}
                  className="btn-primary w-full py-3 rounded-xl text-sm font-bold text-white shadow-glow-pink flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {pending ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Authenticating…</span>
                    </>
                  ) : (
                    <>
                      <span>Open Workspace</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* FORM: MODE 2 - REGISTER / CREATE ACCOUNT */}
            {mode === "register" && (
              <form className="mt-5 space-y-3.5" onSubmit={handleRegister} noValidate>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1" htmlFor="reg-name">
                    Full Name
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    placeholder="e.g. Yash Prajapati"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="field w-full py-2 bg-slate-50/60 focus:bg-white text-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1" htmlFor="reg-email">
                    Work Email Address
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="field w-full py-2 bg-slate-50/60 focus:bg-white text-slate-800 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1" htmlFor="reg-company">
                      Company / Organization
                    </label>
                    <input
                      id="reg-company"
                      type="text"
                      placeholder="e.g. Tecnoprism"
                      value={regCompany}
                      onChange={(e) => setRegCompany(e.target.value)}
                      className="field w-full py-2 bg-slate-50/60 focus:bg-white text-slate-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1" htmlFor="reg-role">
                      Your Primary Role
                    </label>
                    <select
                      id="reg-role"
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      className="field w-full py-2 bg-slate-50/60 focus:bg-white text-slate-800 text-sm"
                    >
                      <option value="Marketing Lead">Marketing Lead</option>
                      <option value="Revenue Operations Lead">Revenue Operations Lead</option>
                      <option value="Growth Director">Growth Director</option>
                      <option value="SEO Specialist">SEO Specialist</option>
                      <option value="Executive / Founder">Executive / Founder</option>
                      <option value="Data Analyst">Data Analyst</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1" htmlFor="reg-password">
                      Password
                    </label>
                    <input
                      id="reg-password"
                      type="password"
                      required
                      placeholder="Min. 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="field w-full py-2 bg-slate-50/60 focus:bg-white text-slate-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1" htmlFor="reg-confirm">
                      Confirm Password
                    </label>
                    <input
                      id="reg-confirm"
                      type="password"
                      required
                      placeholder="Re-type password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="field w-full py-2 bg-slate-50/60 focus:bg-white text-slate-800 text-sm"
                    />
                  </div>
                </div>

                {/* Password strength meter */}
                {regPassword && (
                  <div className="space-y-1">
                    <div className="flex gap-1 h-1.5">
                      {[1, 2, 3, 4].map((bar) => (
                        <div
                          key={bar}
                          className={`flex-1 rounded-full transition-colors ${
                            strength >= bar
                              ? strength >= 3
                                ? "bg-emerald-500"
                                : strength === 2
                                ? "bg-amber-500"
                                : "bg-rose-500"
                              : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {strength >= 3 ? "Strong password" : strength === 2 ? "Moderate password" : "Weak password (add letters & numbers)"}
                    </div>
                  </div>
                )}

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="rounded border-slate-300 text-brandPink focus:ring-brandPink"
                    />
                    <span>I agree to the Terms of Service & Client-Side Privacy Policy</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={pending}
                  className="btn-primary w-full py-2.5 rounded-xl text-sm font-bold text-white shadow-glow-pink flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  {pending ? "Creating Account…" : "Create Free Account & Open Dashboard"}
                </button>
              </form>
            )}

            {/* FORM: MODE 3 - FORGOT PASSWORD */}
            {mode === "forgot" && (
              <form className="mt-6 space-y-4" onSubmit={handleForgot} noValidate>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => { setMode("signin"); setError(""); setSuccessMsg(""); }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="forgot-email">
                    Account Email Address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    placeholder="Enter your registered work email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="field w-full py-2.5 bg-slate-50/60 focus:bg-white text-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="forgot-newpass">
                    Set New Password (Optional)
                  </label>
                  <input
                    id="forgot-newpass"
                    type="password"
                    placeholder="Leave blank for 'password123'"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="field w-full py-2.5 bg-slate-50/60 focus:bg-white text-slate-800 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={pending}
                  className="btn-primary w-full py-3 rounded-xl text-sm font-bold text-white shadow-glow-pink flex items-center justify-center gap-2 cursor-pointer"
                >
                  {pending ? "Updating Password…" : "Reset Password & Continue"}
                </button>
              </form>
            )}
          </div>

          {/* Bottom Switcher & SSO */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              {mode === "signin" ? (
                <span>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("register"); setError(""); setSuccessMsg(""); }}
                    className="text-brandPink font-bold hover:underline cursor-pointer ml-1"
                  >
                    Register new account
                  </button>
                </span>
              ) : (
                <span>
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("signin"); setError(""); setSuccessMsg(""); }}
                    className="text-brandPink font-bold hover:underline cursor-pointer ml-1"
                  >
                    Sign in to your account
                  </button>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Security: AES-256 local encryption</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
