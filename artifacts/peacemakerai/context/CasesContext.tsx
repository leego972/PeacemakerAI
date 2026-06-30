import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { CourtId } from "@/constants/courts";

export interface ChatMessage {
  id: string;
  role: "judge" | "user";
  content: string;
  timestamp: number;
}

export interface Case {
  id: string;
  courtId: CourtId;
  title: string;
  messages: ChatMessage[];
  status: "active" | "deliberating" | "closed";
  verdict?: string;
  verdictType?: "resolved" | "partially_resolved" | "no_resolution";
  createdAt: string;
  updatedAt: string;
}

interface CasesContextValue {
  cases: Case[];
  loading: boolean;
  createCase: (courtId: CourtId, title: string) => Promise<Case | null>;
  getCase: (caseId: string) => Promise<Case | null>;
  closeCase: (caseId: string, verdict: string, verdictType: Case["verdictType"]) => Promise<void>;
  removeCase: (caseId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CasesContext = createContext<CasesContextValue | null>(null);

export function CasesProvider({ children }: { children: React.ReactNode }) {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await apiFetch<Case[]>("/cases");
    if (res.ok) setCases(res.data);
  }, []);

  useEffect(() => {
    apiFetch<Case[]>("/cases").then((res) => {
      if (res.ok) setCases(res.data);
      setLoading(false);
    });
  }, []);

  const createCase = useCallback(async (courtId: CourtId, title: string): Promise<Case | null> => {
    const res = await apiFetch<Case>("/cases", {
      method: "POST",
      body: JSON.stringify({ courtId, title }),
    });
    if (!res.ok) return null;
    const newCase = { ...res.data, messages: [] };
    setCases((prev) => [newCase, ...prev]);
    return newCase;
  }, []);

  const getCase = useCallback(async (caseId: string): Promise<Case | null> => {
    const res = await apiFetch<Case>(`/cases/${caseId}`);
    if (!res.ok) return null;
    return res.data;
  }, []);

  const closeCase = useCallback(async (caseId: string, verdict: string, verdictType: Case["verdictType"]) => {
    const res = await apiFetch<Case>(`/cases/${caseId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "closed", verdict, verdictType }),
    });
    if (res.ok) {
      setCases((prev) => prev.map((c) => c.id === caseId ? { ...c, status: "closed", verdict, verdictType, updatedAt: res.data.updatedAt } : c));
    }
  }, []);

  const removeCase = useCallback(async (caseId: string) => {
    await apiFetch(`/cases/${caseId}`, { method: "DELETE" });
    setCases((prev) => prev.filter((c) => c.id !== caseId));
  }, []);

  return (
    <CasesContext.Provider value={{ cases, loading, createCase, getCase, closeCase, removeCase, refresh }}>
      {children}
    </CasesContext.Provider>
  );
}

export function useCases() {
  const ctx = useContext(CasesContext);
  if (!ctx) throw new Error("useCases must be used within CasesProvider");
  return ctx;
}
