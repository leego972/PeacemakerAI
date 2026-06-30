# PeacemakerAI — Courtroom Privacy and Communication Model

**Purpose:** Define who can see each court session and how parties communicate.

---

## Core Rule

Every court session is private to the users involved in that case only.

A case may be accessed only by:

1. The claimant/plaintiff who filed it.
2. The respondent/defendant who was privately summoned and accepted or declined.
3. Internal safety/moderation/admin systems only where required for safety, abuse handling, legal compliance, or support.

No outside users, followers, public viewers, strangers, celebrities, influencers, or group spectators may access a private court session.

---

## No Party-to-Party Chat

Plaintiff and defendant must not communicate directly with each other inside PeacemakerAI.

The courtroom is **judge-mediated only**:

- Plaintiff submits privately to the judge.
- Defendant submits privately to the judge.
- The judge asks questions.
- The judge may paraphrase safely where needed.
- The judge delivers the non-binding fairness verdict.

The app must not show a normal chat thread where the parties argue with each other.

Correct wording:

```text
All submissions go to the judge. The other person will not see your raw message.
```

---

## What Each Party Can See

### Claimant/plaintiff can see

- Case title
- Their own opening statement
- Their own private submissions to the judge
- Judge questions and judge responses
- Final non-binding fairness verdict
- Case status

### Respondent/defendant can see

- Case title
- Summons text
- Court type
- Response window
- Their own private submissions to the judge
- Judge questions and judge responses
- Final non-binding fairness verdict if they accepted and participated
- Case status

### Respondent/defendant must not automatically see

- The claimant's raw opening statement
- The claimant's raw private submissions
- Private details not mediated by the judge

### Claimant/plaintiff must not automatically see

- The respondent's raw private submissions
- The respondent's private details not mediated by the judge

---

## Judge Output

Judge messages are visible to both participating parties.

The judge may:

- Ask targeted questions.
- Summarise neutrally.
- Paraphrase one party's point when necessary.
- Deliver a non-binding fairness verdict.

The judge must not:

- Tell parties to argue with each other.
- Display one party's raw submission as a quote unless essential and safe.
- Create legal rulings.
- Shame or punish either party.

---

## Declined Summons Rule

If the respondent declines:

1. The case closes as `declined`.
2. The one-off booking remains consumed if the summons was sent.
3. The claimant cannot re-file the same dispute.
4. No one-sided trial should proceed.
5. No verdict should be issued against the absent respondent.
6. No public verdict card may be created.

Correct message to claimant:

```text
The summons was declined. This booking attempt is closed. PeacemakerAI does not run one-sided trials against people who do not participate.
```

---

## Backend Implementation Checkpoint

Implemented behaviour:

- `GET /api/cases` returns only cases where the authenticated user is claimant or respondent.
- `GET /api/cases/:id` requires the authenticated user to be claimant or respondent.
- Raw private user submissions are filtered so the other party does not receive them.
- Judge messages and verdicts may be visible to both participating parties.
- `POST /api/judge/:caseId/message` stores the user's message as a private submission to the judge.
- User messages are not broadcast to the other party through SSE.
- Only judge/system events are broadcast to case participants.
- `POST /api/judge/:caseId/message` is allowed only while the case is `in_session`.
- Declined cases no longer proceed to a one-sided trial path.

Relevant files:

- `artifacts/api-server/src/routes/cases.ts`
- `artifacts/api-server/src/routes/judge.ts`

---

## UI Requirements

The mobile courtroom must look like a judge-mediated hearing, not a chat app.

Use labels:

- `Private submission to Judge`
- `Judge question`
- `Judge response`
- `Fairness verdict`

Do not use labels:

- `Message to other party`
- `Reply to plaintiff`
- `Reply to defendant`
- `Public comment`
- `Chat`

Input placeholder:

```text
Submit your answer to the judge...
```

Helper text near input:

```text
Your raw submission is private to the judge. The other person sees only judge-mediated questions, summaries, and verdicts.
```

---

## Product Principle

PeacemakerAI is not a place for people to argue at each other.

> The judge controls the room. The parties submit to the judge. The judge mediates the outcome.
