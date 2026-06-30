import { ReplitConnectors } from "@replit/connectors-sdk";

type ClientResponse<T> = { data: T; error: null } | { data: null; error: any };

interface RevenueCatClient {
  get<T>(params: { url: string; path?: Record<string, string>; query?: Record<string, unknown>; security?: any }): Promise<ClientResponse<T>>;
  post<T>(params: { url: string; path?: Record<string, string>; body?: unknown; security?: any }): Promise<ClientResponse<T>>;
  patch<T>(params: { url: string; path?: Record<string, string>; body?: unknown; security?: any }): Promise<ClientResponse<T>>;
  delete<T>(params: { url: string; path?: Record<string, string>; security?: any }): Promise<ClientResponse<T>>;
}

export async function getUncachableRevenueCatClient(): Promise<RevenueCatClient> {
  const connectors = new ReplitConnectors();

  function resolvePath(url: string, path?: Record<string, string>): string {
    // SDK sends paths like "/projects", we need to prefix with /v2
    let resolved = "/v2" + url;
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
    let resolved = resolvePath(url, path);
    if (query) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null) params.set(k, String(v));
      }
      const qs = params.toString();
      if (qs) resolved += `?${qs}`;
    }

    const options: any = { method };
    // Pass body as object so connectors SDK auto-sets Content-Type: application/json
    if (body !== undefined) options.body = body;

    const response = await connectors.proxy("revenuecat", resolved, options);
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
