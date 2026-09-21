/**
 * Browser-only gate. It verifies nothing: the check runs in code the visitor can
 * read and edit. Use it for local demos and screenshots only. Any deployment
 * that holds real customer data must run with VITE_AUTH_MODE=api.
 */
const KEY = "dashboard.demo-session";

const validate = (email, password) => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error("Enter a valid email address.");
  if (password.length < 6) throw new Error("Passwords are at least 6 characters.");
};

export const demoAuth = {
  mode: "demo",
  insecure: true,

  async restore() {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async signIn({ email, password }) {
    validate(email, password);
    const user = { email: email.trim(), name: email.trim().split("@")[0].replace(/[._-]+/g, " ") };
    try { sessionStorage.setItem(KEY, JSON.stringify(user)); } catch { /* private mode */ }
    return user;
  },

  async signOut() {
    try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
  },
};
