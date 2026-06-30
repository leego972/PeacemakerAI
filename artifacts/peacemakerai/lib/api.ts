import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "@peacemakerai/token";

let _token: string | null = null;

export async function loadToken(): Promise<string | null> {
  if (_token) return _token;
  _token = await AsyncStorage.getItem(TOKEN_KEY);
  return _token;
}

export async function saveToken(token: string): Promise<void> {
  _token = token;
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  _token = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
}

function getBaseUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}`;
  return "";
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  const token = await loadToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${getBaseUrl()}/api${path}`, {
      ...options,
      headers,
    });

    if (res.status === 204) return { ok: true, data: undefined as T };

    const json = await res.json();
    if (!res.ok) {
      return { ok: false, error: json?.error ?? "Request failed", status: res.status };
    }
    return { ok: true, data: json as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error", status: 0 };
  }
}
