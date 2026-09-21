import { useState } from "react";
import { useAuth } from "./AuthContext.jsx";

export function SignIn() {
  const { signIn, signUp, resetPassword } = useAuth();
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
      setError(err.message || "Sign-in failed. Please check your credentials.");
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
      setError("Please accept the Terms of Service.");
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
      setSuccessMsg("Password reset successfully! You can now log in.");
      setEmail(forgotEmail);
      setPassword(forgotNewPassword || "password123");
      setMode("signin");
    } catch (err) {
      setError(err.message || "Could not reset password.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-3 sm:p-5 lg:p-8 bg-slate-950 font-sans overflow-y-auto">
      {/* Background Ambient Glows */}
      <div className="fixed top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brandPink/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/3 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-brandCyan/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container - Compact & 100% visible */}
      <div className="relative z-10 w-full max-w-4xl rounded-2xl sm:rounded-3xl bg-white shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 my-auto">
        {/* LEFT PANEL: Branding & Visual Value */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0A0E1A] p-6 sm:p-8 text-white flex flex-col justify-between relative">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FA2E76] to-[#7B61FF] text-white shadow-glow-pink">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div>
                <span className="font-display text-xl font-black tracking-tight text-white flex items-center">
                  OmniScope<span className="text-brandPink">.</span>
                </span>
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase block">
                  Sales & SEO Suite
                </span>
              </div>
            </div>

            {/* Tagline */}
            <div className="mt-5">
              <h1 className="font-display text-xl sm:text-2xl font-bold leading-snug text-white tracking-tight">
                Unified Revenue & Search Intelligence
              </h1>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Connect SEO performance, multi-channel email campaigns, software SaaS costs, and deal funnels in one place.
              </p>
            </div>

            {/* Value Highlights */}
            <div className="mt-5 space-y-2.5">
              <div className="flex items-center gap-2.5 rounded-lg bg-white/5 p-2.5 border border-white/10 text-xs">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-500/20 text-cyan-300">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                </span>
                <span className="text-slate-200">
                  <strong>Multi-Site SEO:</strong> Tecnoprism (64,002 views) & Automation CoE
                </span>
              </div>

              <div className="flex items-center gap-2.5 rounded-lg bg-white/5 p-2.5 border border-white/10 text-xs">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-pink-500/20 text-pink-300">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <span className="text-slate-200">
                  <strong>Email Intel:</strong> 99.4% Delivery & engagement metrics
                </span>
              </div>

              <div className="flex items-center gap-2.5 rounded-lg bg-white/5 p-2.5 border border-white/10 text-xs">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-purple-500/20 text-purple-300">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M12 20V10M18 20V4M6 20v-4" />
                  </svg>
                </span>
                <span className="text-slate-200">
                  <strong>Conversion Funnel:</strong> Stage velocity & revenue tracking
                </span>
              </div>
            </div>
          </div>

          {/* Privacy badge */}
          <div className="mt-6 pt-3.5 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400 shrink-0">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Client-side local parsing. No files are uploaded to servers.</span>
          </div>
        </div>

        {/* RIGHT PANEL: Form */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-white">
          <div>
            {/* Mode Switcher */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setMode("signin"); setError(""); setSuccessMsg(""); }}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
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
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    mode === "register"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {mode !== "forgot" && (
                <button
                  type="button"
                  onClick={() => { setMode("forgot"); setError(""); setSuccessMsg(""); }}
                  className="text-xs text-slate-500 hover:text-brandPink font-medium cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>{successMsg}</span>
              </div>
            )}

            {/* 1. SIGN IN FORM */}
            {mode === "signin" && (
              <form className="mt-4 space-y-3.5" onSubmit={handleSignIn} noValidate>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1" htmlFor="email">
                    Work Email
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <input
                      id="email"
                      type="email"
                      autoComplete="username"
                      required
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="field w-full pl-9 pr-3 py-2 bg-slate-50/60 focus:bg-white text-slate-800 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="password">
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
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="field w-full pl-9 pr-3 py-2 bg-slate-50/60 focus:bg-white text-slate-800 text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-brandPink focus:ring-brandPink"
                    />
                    <span>Remember me on this device</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={pending}
                  className="btn-primary w-full py-2.5 rounded-xl text-sm font-bold text-white shadow-glow-pink flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  {pending ? "Signing in…" : "Sign In to Dashboard"}
                </button>
              </form>
            )}

            {/* 2. REGISTER FORM */}
            {mode === "register" && (
              <form className="mt-3.5 space-y-3" onSubmit={handleRegister} noValidate>
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
                    Work Email
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

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1" htmlFor="reg-company">
                      Company
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
                      Role
                    </label>
                    <select
                      id="reg-role"
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      className="field w-full py-2 bg-slate-50/60 focus:bg-white text-slate-800 text-sm"
                    >
                      <option value="Marketing Lead">Marketing Lead</option>
                      <option value="Revenue Operations Lead">Revenue Operations</option>
                      <option value="Growth Director">Growth Director</option>
                      <option value="SEO Specialist">SEO Specialist</option>
                      <option value="Executive">Executive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1" htmlFor="reg-password">
                      Password
                    </label>
                    <input
                      id="reg-password"
                      type="password"
                      required
                      placeholder="Min. 6 chars"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="field w-full py-2 bg-slate-50/60 focus:bg-white text-slate-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1" htmlFor="reg-confirm">
                      Confirm
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

                {regPassword && (
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className={`flex-1 rounded-full ${
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
                )}

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none pt-0.5">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="rounded border-slate-300 text-brandPink focus:ring-brandPink"
                  />
                  <span>I agree to the Terms of Service & Privacy Policy</span>
                </label>

                <button
                  type="submit"
                  disabled={pending}
                  className="btn-primary w-full py-2.5 rounded-xl text-sm font-bold text-white shadow-glow-pink flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  {pending ? "Creating Account…" : "Create Free Account & Open Dashboard"}
                </button>
              </form>
            )}

            {/* 3. FORGOT PASSWORD */}
            {mode === "forgot" && (
              <form className="mt-4 space-y-3.5" onSubmit={handleForgot} noValidate>
                <div className="flex items-center gap-2 mb-1">
                  <button
                    type="button"
                    onClick={() => { setMode("signin"); setError(""); setSuccessMsg(""); }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1" htmlFor="forgot-email">
                    Account Email
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    placeholder="Enter registered work email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="field w-full py-2 bg-slate-50/60 focus:bg-white text-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1" htmlFor="forgot-newpass">
                    New Password
                  </label>
                  <input
                    id="forgot-newpass"
                    type="password"
                    placeholder="New password (min. 6 characters)"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="field w-full py-2 bg-slate-50/60 focus:bg-white text-slate-800 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={pending}
                  className="btn-primary w-full py-2.5 rounded-xl text-sm font-bold text-white shadow-glow-pink flex items-center justify-center gap-2 cursor-pointer"
                >
                  {pending ? "Updating…" : "Reset Password & Sign In"}
                </button>
              </form>
            )}
          </div>

          {/* Bottom Switcher */}
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              {mode === "signin" ? (
                <span>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("register"); setError(""); setSuccessMsg(""); }}
                    className="text-brandPink font-bold hover:underline cursor-pointer ml-0.5"
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
                    className="text-brandPink font-bold hover:underline cursor-pointer ml-0.5"
                  >
                    Sign in here
                  </button>
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-400">
              AES-256 local
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
