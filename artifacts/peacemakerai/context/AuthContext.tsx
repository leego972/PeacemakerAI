import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "";
const TOKEN_KEY = "auth_token";

export interface User {
  id: string;
  name: string;
  email: string;
  dob?: string;
  relationshipStatus?: string;
  ageTier?: "teen" | "adult";
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  signUp: (
    name: string,
    email: string,
    password: string,
    dob: string,
    relationshipStatus: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function apiFetch<T>(path: string, token: string | null, options?: RequestInit): Promise<{ ok: boolean; data: T; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers ?? {}),
      },
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, data: json, error: json.error ?? "Request failed" };
    return { ok: true, data: json };
  } catch (e: any) {
    return { ok: false, data: null as any, error: e?.message ?? "Network error" };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(TOKEN_KEY).then(async (saved) => {
      if (!saved) { setLoading(false); return; }
      setToken(saved);
      const res = await apiFetch<User>("/auth/me", saved);
      if (res.ok) setUser(res.data);
      else {
        await AsyncStorage.removeItem(TOKEN_KEY);
        setToken(null);
      }
      setLoading(false);
    });
  }, []);

  const signUp = useCallback(async (
    name: string, email: string, password: string,
    dob: string, relationshipStatus: string,
  ) => {
    const res = await apiFetch<{ token: string; user: User }>("/auth/signup", null, {
      method: "POST",
      body: JSON.stringify({ name, email, password, dob, relationshipStatus }),
    });
    if (!res.ok) return { ok: false, error: res.error };
    await AsyncStorage.setItem(TOKEN_KEY, res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return { ok: true };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ token: string; user: User }>("/auth/signin", null, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return { ok: false, error: res.error };
    await AsyncStorage.setItem(TOKEN_KEY, res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    const res = await apiFetch<User>("/auth/me", token);
    if (res.ok) setUser(res.data);
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, signUp, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
