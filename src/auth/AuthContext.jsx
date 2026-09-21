import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { demoAuth } from "./adapters/demo.js";
import { apiAuth } from "./adapters/api.js";

const MODE = import.meta.env.VITE_AUTH_MODE || "demo";
export const adapter = MODE === "api" ? apiAuth : demoAuth;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    let alive = true;
    adapter.restore().then((u) => {
      if (alive) { setUser(u); setRestoring(false); }
    });
    return () => { alive = false; };
  }, []);

  const signIn = useCallback(async (credentials) => {
    const u = await adapter.signIn(credentials);
    setUser(u);
    return u;
  }, []);

  const signOut = useCallback(async () => {
    await adapter.signOut();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, restoring, signIn, signOut, insecure: adapter.insecure, mode: adapter.mode }),
    [user, restoring, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
