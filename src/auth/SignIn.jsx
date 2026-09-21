import { useState } from "react";
import { useAuth } from "./AuthContext.jsx";

export function SignIn() {
  const { signIn, insecure } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      await signIn({ email, password });
    } catch (err) {
      setError(err.message || "Sign-in failed.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-5 py-10">
      <div className="grid w-full grid-cols-1 border border-hairline md:grid-cols-2">
        <div className="flex flex-col justify-between bg-rail p-8 text-white">
          <div>
            <p className="text-xs text-railInk">Revenue operations</p>
            <h1 className="mt-3 font-display text-3xl leading-tight">Sales pipeline and search performance</h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-railInk">
              Every lead sheet and the weekly SEO matrix in one place, filtered by any period you choose.
              Spreadsheets are read in your browser and never uploaded.
            </p>
          </div>
          <svg viewBox="0 0 260 60" className="mt-8 w-full max-w-[260px]" aria-hidden="true">
            <polyline points="0,48 26,42 52,45 78,34 104,36 130,26 156,28 182,18 208,20 234,10 260,6"
              fill="none" stroke="#4C8C86" strokeWidth="2" />
            <polyline points="0,54 26,52 52,53 78,47 104,49 130,42 156,44 182,38 208,39 234,32 260,29"
              fill="none" stroke="#C0863A" strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>
        </div>

        <form className="bg-panel p-8" onSubmit={submit} noValidate>
          <h2 className="text-lg font-semibold">Sign in</h2>
          <p className="mt-1 text-sm text-muted">Use your work email to open the dashboard.</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="username" className="field w-full"
                value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="password">Password</label>
              <input id="password" type="password" autoComplete="current-password" className="field w-full"
                value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>

            {error && <p role="alert" className="text-sm text-lost">{error}</p>}

            <button type="submit" className="btn btn-primary w-full py-2.5" disabled={pending}>
              {pending ? "Signing in…" : "Sign in"}
            </button>

            {insecure && (
              <button type="button" className="w-full cursor-pointer border-none bg-transparent p-1 text-sm text-accent"
                onClick={() => { setEmail("you@company.com"); setPassword("demo1234"); setError(""); }}>
                Fill in demo details
              </button>
            )}
          </div>

          {insecure && (
            <p className="mt-6 border-t border-hair pt-3.5 text-xs leading-relaxed text-muted">
              This build runs in demo mode: sign-in happens entirely in the browser and checks nothing against a
              server. It gates a demo, it does not protect data. Set <code>VITE_AUTH_MODE=api</code> and point
              <code> VITE_AUTH_API_URL</code> at your backend before anyone real uses this.
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
