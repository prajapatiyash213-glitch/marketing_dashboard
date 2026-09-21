/**
 * Real authentication. Credentials are posted to your backend, which is expected
 * to set an httpOnly, SameSite=Strict session cookie and return the user.
 * No token is ever held in JavaScript, so an XSS bug cannot read the session.
 *
 * Expected endpoints:
 *   POST {base}/auth/session   { email, password } -> 200 { user } | 401
 *   GET  {base}/auth/session                       -> 200 { user } | 401
 *   DELETE {base}/auth/session                     -> 204
 */
const base = (import.meta.env.VITE_AUTH_API_URL || "").replace(/\/$/, "");

const request = async (path, init) => {
  const res = await fetch(`${base}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  return res;
};

export const apiAuth = {
  mode: "api",
  insecure: false,

  async restore() {
    try {
      const res = await request("/auth/session", { method: "GET" });
      if (!res.ok) return null;
      const { user } = await res.json();
      return user ?? null;
    } catch {
      return null;
    }
  },

  async signIn({ email, password }) {
    let res;
    try {
      res = await request("/auth/session", { method: "POST", body: JSON.stringify({ email, password }) });
    } catch {
      throw new Error("Could not reach the sign-in service. Check your connection and try again.");
    }
    if (res.status === 401) throw new Error("That email and password combination was not recognised.");
    if (res.status === 429) throw new Error("Too many attempts. Wait a minute before trying again.");
    if (!res.ok) throw new Error("Sign-in failed. Try again, or contact your administrator.");
    const { user } = await res.json();
    return user;
  },

  async signOut() {
    try { await request("/auth/session", { method: "DELETE" }); } catch { /* best effort */ }
  },
};
