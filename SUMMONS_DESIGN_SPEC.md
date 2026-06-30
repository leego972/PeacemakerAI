# PeacemakerAI — Premium Mobile Summons Design Spec

**Purpose:** Make the summons visually attractive, ceremonial, mobile-native, and share-worthy without making it look like a real legal notice or accusation.

---

## Core Design Direction

The summons should feel like:

> A private ceremonial court invitation inside a premium mobile app.

It should not feel like:

- A real court document
- A legal threat
- A debt letter
- A police notice
- A public accusation
- A hostile confrontation

---

## Visual Style

Use:

- Dark navy mobile background
- Gold/amber legal seal styling
- Rounded court-document card
- Fine gold border
- Corner ornaments
- Serif heading treatment
- Script-style PeacemakerAI wordmark treatment
- Feather icons only
- No emojis
- No public names or handles

Suggested typography:

- Script accent: iOS `Snell Roundhand`; Android fallback `serif`
- Legal heading: iOS `Georgia`; Android fallback `serif`
- Body/UI: Inter

Do not bundle or redistribute proprietary font files.

---

## Summons Screen Copy

Headline:

```text
Formal Summons
```

Kicker:

```text
PeacemakerAI
```

Subheading:

```text
Private fairness hearing request
```

Body:

```text
Someone you know has requested your voluntary response in a private PeacemakerAI hearing. This is not a legal notice, not a court order, and not an accusation of guilt.
```

Fine print:

```text
You may accept, decline, block, or report. Declining does not mean you agree with the case.
```

Privacy notice:

```text
This is private and non-binding. If you decline, PeacemakerAI will not create a public verdict against you.
```

---

## Required Data Fields

The summons card should show only safe, limited fields:

- Case title
- Hearing type
- Response window
- Status

Do not show:

- Full raw opening argument
- Private addresses
- Legal accusations
- Sensitive child details
- Public handles
- Direct user-to-user messages

---

## Buttons

Primary CTA:

```text
Accept Summons
```

Secondary CTA:

```text
Decline
```

Tertiary text action:

```text
Block or Report Concern
```

Do not use:

- Fight back
- Defend yourself now
- You are accused
- Guilty / not guilty
- Face your accuser

---

## Implemented File

Current mobile summons screen:

```text
artifacts/peacemakerai/app/case/summons.tsx
```

Implementation notes:

- Uses a legal-document card layout.
- Uses script/serif styling through platform fonts.
- Uses gold seal and corner ornaments.
- Uses voluntary, non-accusatory wording.
- Shows accept/decline/block-report paths.
- States that the summons is private and non-binding.

---

## Product Principle

The summons should be dramatic enough to feel viral, but careful enough to avoid fear, coercion, legal confusion, or public shaming.

> Ceremonial, not threatening. Premium, not fake-legal. Private, not public.
