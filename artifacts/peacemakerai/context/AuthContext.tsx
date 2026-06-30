import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch, clearToken, loadToken, saveToken } from "@/lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signUp: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadToken().then(async (token) => {
      if (!token) { setLoading(false); return; }
      const res = await apiFetch<User>("/auth/me");
      if (res.ok) setUser(res.data);
      else await clearToken();
      setLoading(false);
    });
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const res = await apiFetch<{ token: string; user: User }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) return { ok: false, error: res.error };
    await saveToken(res.data.token);
    setUser(res.data.user);
    return { ok: true };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ token: string; user: User }>("/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return { ok: false, error: res.error };
    await saveToken(res.data.token);
    setUser(res.data.user);
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    await clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
