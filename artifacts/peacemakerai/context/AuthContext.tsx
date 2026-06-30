import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { clearUser, getUser, saveUser, type User } from "@/lib/storage";
import { generateId } from "@/lib/storage";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signUp: (name: string, email: string) => Promise<void>;
  signIn: (email: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const signUp = useCallback(async (name: string, email: string) => {
    const newUser: User = { id: generateId(), name, email };
    await saveUser(newUser);
    setUser(newUser);
  }, []);

  const signIn = useCallback(async (email: string) => {
    const existing = await getUser();
    if (existing && existing.email.toLowerCase() === email.toLowerCase()) {
      setUser(existing);
      return { ok: true };
    }
    return { ok: false, error: "No account found with that email. Please sign up first." };
  }, []);

  const signOut = useCallback(async () => {
    await clearUser();
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
