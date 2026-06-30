# PeacemakerAI

A mobile-first (iOS + Android + Web) AI-powered dispute resolution app. Users file cases before an AI Judge (Groq Llama 3.3 70B) across 6 court types: Dating, Engaged, Married, Divorced, School Relationship, Friend, and Group Court. Safety detection halts proceedings immediately when violence, abuse, or child endangerment is detected — and routes users to real crisis resources.

## Run & Operate

- `pnpm --filter @workspace/peacemakerai run dev` — start the Expo dev server
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- Required env: `EXPO_PUBLIC_GROQ_API_KEY` — Groq API key for the AI Judge (get at console.groq.com)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo ~54 + React Native 0.81 + Expo Router (file-based)
- Styling: React Native StyleSheet, dark navy/gold theme
- AI: Groq API (Llama 3.3 70B) via direct fetch
- Storage: AsyncStorage (cases + auth — no backend DB yet)
- API: Express 5 (api-server artifact)

## Where things live

- `artifacts/peacemakerai/` — Expo mobile app
- `artifacts/peacemakerai/app/` — All screens (Expo Router)
- `artifacts/peacemakerai/context/` — AuthContext, CasesContext
- `artifacts/peacemakerai/lib/` — groq.ts, safety.ts, prompts.ts, storage.ts
- `artifacts/peacemakerai/constants/` — courts.ts, resources.ts, safety.ts (trigger words)
- `artifacts/peacemakerai/components/` — JudgeMessage, UserMessage, VerdictCard, CourtSelector, SafetyBanner
- `artifacts/api-server/` — Express API server

## Architecture decisions

- AsyncStorage for case + auth persistence (Supabase can replace in v2)
- Groq called directly from Expo client (needs EXPO_PUBLIC_GROQ_API_KEY)
- Safety detection runs on BOTH client input AND Groq responses — double-layered
- AI judge is limited to 200 tokens max to enforce concise replies
- Verdict triggers automatically after 8 message exchanges OR when judge says "Court is adjourned"

## Product

- Welcome → Sign Up / Sign In → Dashboard (My Cases)
- File a Case → Choose Court → Describe situation → AI Judge chat
- Safety stop: any violence/abuse/child endangerment keyword halts court, shows crisis resources
- Verdict: delivered after sufficient testimony, with resolved/partially-resolved/no-resolution types
- Safety tab: always-accessible crisis hotlines

## User preferences

- AI judge replies must be concise and to the point (max 200 tokens, ~80 words enforced in prompt)
- No advice that could cause legal liability — judge only observes and asks clarifying questions
- Violence / abuse / child endangerment → immediate court stop + safety resources shown
- No emojis in UI

## Gotchas

- EXPO_PUBLIC_GROQ_API_KEY must be set or the judge shows an "unavailable" message
- Do NOT use NativeTabs screen names that don't match the actual file names in `(tabs)/`
- Expo Go compatible only — do not add non-Expo-Go libraries
- Safety check runs on user input before it hits Groq, AND Groq is instructed to return "SAFETY_STOP"

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `expo` skill for Expo Router conventions and React Native patterns
