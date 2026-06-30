---
name: RevenueCat proxy client
description: How to wrap the Replit connectors proxy to satisfy the @replit/revenuecat-sdk client interface.
---

The `@replit/revenuecat-sdk` typed functions (e.g. `listProjects`, `listAppPublicApiKeys`) call `client.get({ url: "/projects", ... })` — note the path is relative to a base URL that excludes `/v2`. You must prefix every URL with `/v2` in the wrapper.

**Why:** The SDK is designed for a generic HTTP client; it passes bare paths like `/projects` and `/apps/{app_id}/api_keys`. The RevenueCat REST API is versioned at `/v2/`, so without the prefix every call returns `{"code":7117,"message":"Page not found."}`.

**How to apply:** In `scripts/src/revenueCatClient.ts`, the `resolvePath` function prepends `/v2` before substituting path params:
```ts
let resolved = "/v2" + url;
```

Also: pass `body` as a plain JS object to `connectors.proxy()` — the SDK auto-sets `Content-Type: application/json`. Passing a JSON string or `JSON.stringify()` will double-encode it.
