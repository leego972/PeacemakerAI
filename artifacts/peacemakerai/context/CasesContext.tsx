import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  getCases,
  saveCase,
  deleteCase,
  getCaseById,
  type Case,
  type ChatMessage,
  generateId,
} from "@/lib/storage";
import type { CourtId } from "@/constants/courts";

interface CasesContextValue {
  cases: Case[];
  loading: boolean;
  createCase: (courtId: CourtId, title: string) => Promise<Case>;
  addMessage: (caseId: string, message: Omit<ChatMessage, "id">) => Promise<Case | null>;
  closeCase: (caseId: string, verdict: string, verdictType: Case["verdictType"]) => Promise<void>;
  removeCase: (caseId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CasesContext = createContext<CasesContextValue | null>(null);

export function CasesProvider({ children }: { children: React.ReactNode }) {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const all = await getCases();
    setCases(all);
  }, []);

  useEffect(() => {
    getCases().then((all) => {
      setCases(all);
      setLoading(false);
    });
  }, []);

  const createCase = useCallback(async (courtId: CourtId, title: string): Promise<Case> => {
    const newCase: Case = {
      id: generateId(),
      courtId,
      title,
      messages: [],
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveCase(newCase);
    setCases((prev) => [newCase, ...prev]);
    return newCase;
  }, []);

  const addMessage = useCallback(
    async (caseId: string, message: Omit<ChatMessage, "id">): Promise<Case | null> => {
      const existing = await getCaseById(caseId);
      if (!existing) return null;
      const updated: Case = {
        ...existing,
        messages: [
          ...existing.messages,
          { ...message, id: generateId() },
        ],
        updatedAt: Date.now(),
      };
      await saveCase(updated);
      setCases((prev) => prev.map((c) => (c.id === caseId ? updated : c)));
      return updated;
    },
    []
  );

  const closeCase = useCallback(
    async (caseId: string, verdict: string, verdictType: Case["verdictType"]) => {
      const existing = await getCaseById(caseId);
      if (!existing) return;
      const updated: Case = {
        ...existing,
        status: "closed",
        verdict,
        verdictType,
        updatedAt: Date.now(),
      };
      await saveCase(updated);
      setCases((prev) => prev.map((c) => (c.id === caseId ? updated : c)));
    },
    []
  );

  const removeCase = useCallback(async (caseId: string) => {
    await deleteCase(caseId);
    setCases((prev) => prev.filter((c) => c.id !== caseId));
  }, []);

  return (
    <CasesContext.Provider
      value={{ cases, loading, createCase, addMessage, closeCase, removeCase, refresh }}
    >
      {children}
    </CasesContext.Provider>
  );
}

export function useCases() {
  const ctx = useContext(CasesContext);
  if (!ctx) throw new Error("useCases must be used within CasesProvider");
  return ctx;
}
