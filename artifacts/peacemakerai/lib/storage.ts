import AsyncStorage from "@react-native-async-storage/async-storage";
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
  createdAt: number;
  updatedAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

const KEYS = {
  USER: "@peacemakerai/user",
  CASES: "@peacemakerai/cases",
};

export async function getUser(): Promise<User | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveUser(user: User): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export async function clearUser(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.USER);
}

export async function getCases(): Promise<Case[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CASES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveCase(caseData: Case): Promise<void> {
  const cases = await getCases();
  const idx = cases.findIndex((c) => c.id === caseData.id);
  if (idx >= 0) {
    cases[idx] = caseData;
  } else {
    cases.unshift(caseData);
  }
  await AsyncStorage.setItem(KEYS.CASES, JSON.stringify(cases));
}

export async function getCaseById(id: string): Promise<Case | null> {
  const cases = await getCases();
  return cases.find((c) => c.id === id) ?? null;
}

export async function deleteCase(id: string): Promise<void> {
  const cases = await getCases();
  const filtered = cases.filter((c) => c.id !== id);
  await AsyncStorage.setItem(KEYS.CASES, JSON.stringify(filtered));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
