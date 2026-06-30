const RC_BASE = "https://api.revenuecat.com/v2";

type ClientResponse<T> = { data: T; error: null } | { data: null; error: any };

interface RevenueCatClient {
  get<T>(params: { url: string; path?: Record<string, string>; query?: Record<string, unknown>; security?: any }): Promise<ClientResponse<T>>;
  post<T>(params: { url: string; path?: Record<string, string>; body?: unknown; security?: any }): Promise<ClientResponse<T>>;
  patch<T>(params: { url: string; path?: Record<string, string>; body?: unknown; security?: any }): Promise<ClientResponse<T>>;
  delete<T>(params: { url: string; path?: Record<string, string>; security?: any }): Promise<ClientResponse<T>>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getUncachableRevenueCatClient(): Promise<any> {
  const apiKey = process.env.REVENUECAT_SECRET_KEY;
  if (!apiKey) throw new Error("REVENUECAT_SECRET_KEY env var is not set");

  function resolvePath(url: string, path?: Record<string, string>): string {
    let resolved = url;
    if (path) {
      for (const [k, v] of Object.entries(path)) {
        resolved = resolved.replace(`{${k}}`, v);
      }
    }
    return resolved;
  }

  async function request<T>(
    method: string,
    url: string,
    path?: Record<string, string>,
    query?: Record<string, unknown>,
    body?: unknown,
  ): Promise<ClientResponse<T>> {
    let resolved = RC_BASE + resolvePath(url, path);
    if (query) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null) params.set(k, String(v));
      }
      const qs = params.toString();
      if (qs) resolved += `?${qs}`;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    const init: RequestInit = { method, headers };
    if (body !== undefined) init.body = JSON.stringify(body);

    const response = await fetch(resolved, init);
    const json = await response.json();

    if (!response.ok) return { data: null, error: json };
    return { data: json as T, error: null };
  }

  return {
    get: <T>({ url, path, query }: { url: string; path?: Record<string, string>; query?: Record<string, unknown>; security?: any }) =>
      request<T>("GET", url, path, query),
    post: <T>({ url, path, body }: { url: string; path?: Record<string, string>; body?: unknown; security?: any }) =>
      request<T>("POST", url, path, undefined, body),
    patch: <T>({ url, path, body }: { url: string; path?: Record<string, string>; body?: unknown; security?: any }) =>
      request<T>("PATCH", url, path, undefined, body),
    delete: <T>({ url, path }: { url: string; path?: Record<string, string>; security?: any }) =>
      request<T>("DELETE", url, path),
  };
}
