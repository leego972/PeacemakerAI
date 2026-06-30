# PeacemakerAI — Repeat Dispute Guard

**Purpose:** Prevent users from filing the same dispute again and again against the same person.

---

## Product Rule

The same dispute must not be heard repeatedly.

PeacemakerAI must block repeat filings when a user tries to submit a highly similar case against the same linked person/contact.

Reason:

- Prevent pressure-spam against respondents.
- Prevent harassment through repeated summons.
- Prevent judge-shopping.
- Prevent verdict-shopping.
- Preserve trust in Fair Call and finality.
- Keep the app focused on resolution, not endless argument loops.

---

## Correct User Experience

If a user tries to file the same dispute again, the app should not create a new summons.

Show:

```text
This looks like a dispute you have already filed.
PeacemakerAI does not allow repeated hearings for the same argument.

Open the existing case, use Fair Call, or create a new case only if something materially new happened.
```

Primary action:

```text
Open Existing Case
```

Secondary action:

```text
Back to My Cases
```

Optional tertiary action:

```text
Start New Incident
```

Only show “Start New Incident” if the user confirms there are new facts, a new date, or a materially different event.

---

## Backend Behaviour

Implemented files:

- `artifacts/api-server/src/lib/repeatDispute.ts`
- `artifacts/api-server/src/routes/admissions.ts`
- `artifacts/api-server/src/routes/cases.ts`

The backend checks for repeated disputes in two places:

1. `POST /api/admissions/screen`
2. `POST /api/cases`

The duplicate check compares recent cases for the same `relationshipId` and same `courtType`.

It blocks when:

- The title is identical or highly similar.
- The opening argument is highly similar.
- A matching active case already exists.
- A matching closed case has already been handled.

Blocked response category:

```json
{
  "category": "repeat_dispute",
  "route": "repeat_dispute",
  "existingCaseId": "...",
  "existingStatus": "..."
}
```

---

## Active Duplicate Rule

If a similar case is active, route the user to the existing case.

Active statuses:

- `pending_response`
- `in_session`
- `awaiting_fair_call`

Correct response:

```text
A similar dispute is already active. Continue that case instead of filing another summons.
```

---

## Closed Duplicate Rule

If a similar case was already handled, do not allow the same dispute to be run again.

Closed statuses:

- `resolved`
- `declined`
- `expired`
- `dismissed`
- `one_sided_verdict`

Correct response:

```text
This dispute has already been handled. PeacemakerAI does not allow repeated hearings for the same argument or verdict-shopping.
```

---

## New Incident Exception

A user may file a new case only if there is a materially new incident.

Examples of materially new facts:

- A new event happened on a different date.
- A new behaviour occurred after the previous case ended.
- There is a different issue, not just dissatisfaction with the verdict.
- The previous case was about lateness, but the new case is about disrespectful messages.

Not enough:

- “I did not like the verdict.”
- “I want a different judge.”
- “They declined last time.”
- “I want to ask again.”
- “I wrote it differently this time.”

---

## UI Requirements

The mobile UI must support a `repeat_dispute` admissions route.

When admissions returns:

```json
{
  "accepted": false,
  "route": "repeat_dispute",
  "category": "repeat_dispute",
  "existingCaseId": "..."
}
```

The app must show a Repeat Dispute screen with:

- Explanation
- Existing case status
- Open Existing Case button
- Back to My Cases button
- No paywall
- No summons creation
- No judge assignment reveal

---

## Product Principle

PeacemakerAI is designed to resolve arguments, not recycle them.

> One dispute. One hearing. One Fair Call path.
