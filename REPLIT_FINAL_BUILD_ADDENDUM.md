# PeacemakerAI — Final Replit Build Addendum

**Purpose:** Supersede any older instructions that conflict with the latest product rules.

This file must be read after:

- `REPLIT_ONE_PASS_BUILD_INSTRUCTIONS.md`
- `PEACEMAKERAI_DIRECTION.md`
- `COURTROOM_PRIVACY_MODEL.md`
- `BOOKING_CHARGE_POLICY.md`
- `SUMMONS_DESIGN_SPEC.md`
- `REPEAT_DISPUTE_GUARD.md`
- `CHILD_BULLYING_SAFETY_FLOW.md`

---

## 1. Mobile Only

PeacemakerAI is an iOS/Android app built with Expo React Native.

Do not build web-first UI. Web preview is only for development convenience.

---

## 2. Updated Pricing

The old `$1.99` one-off price is deprecated.

Use:

```text
Book One Hearing — USD $2.99
```

RevenueCat product ID:

```text
peacemaker_single_booking_299
```

Monthly:

```text
peacemaker_unlimited_monthly_699 — USD $6.99/month
```

Annual:

```text
peacemaker_unlimited_annual_4999 — USD $49.99/year
```

One-off bookings are consumed once the eligible summons is sent, even if the invited person declines or does not respond.

Members receive unlimited eligible bookings, but all safety, suitability, anti-spam, and repeat-dispute rules still apply.

---

## 3. Declined Summons Rule

If the respondent declines:

- Do not run a one-sided trial.
- Do not issue a verdict against the absent party.
- Do not create a public verdict card.
- Close the booking attempt as declined.
- Keep the one-off booking consumed if the summons was sent.
- Block refiling of the same dispute.

UI wording:

```text
The summons was declined. This booking attempt is closed. PeacemakerAI does not run one-sided trials against people who do not participate.
```

---

## 4. Judge-Mediated Communication Only

Plaintiff and defendant must not communicate directly with each other.

All communication goes through the AI judge:

- Plaintiff submits to judge.
- Defendant submits to judge.
- Judge asks questions.
- Judge paraphrases safely where needed.
- Judge delivers non-binding fairness verdict.

Courtroom input placeholder:

```text
Submit your answer to the judge...
```

Helper text:

```text
Your raw submission is private to the judge. The other person sees only judge-mediated questions, summaries, and verdicts.
```

Do not build a direct chat UI between the parties.

---

## 5. Session Privacy

Each court session is visible only to the users involved in that case.

No public room.  
No spectators.  
No group pile-on.  
No public trial.  
No celebrity/influencer/public handle summons.

Only the claimant and respondent can access the case, plus internal safety/moderation systems where required.

---

## 6. Summons Visual Design

The summons must look premium, ceremonial, and visually attractive.

Use:

- Script-style PeacemakerAI wordmark treatment
- Serif legal-document heading
- Dark navy background
- Gold seal
- Fine gold border
- Corner ornaments
- Rounded legal-document card
- Feather icons only
- No emojis
- Safe, non-threatening copy

Do not make it look like a real legal threat.

Copy:

```text
Formal Summons
Private fairness hearing request
```

Body:

```text
Someone you know has requested your voluntary response in a private PeacemakerAI hearing. This is not a legal notice, not a court order, and not an accusation of guilt.
```

Buttons:

- Accept Summons
- Decline
- Block or Report Concern

---

## 7. Repeat Dispute Guard

Do not allow the same dispute to be booked repeatedly.

If admissions returns `repeat_dispute`, show:

```text
This looks like a dispute you have already filed. PeacemakerAI does not allow repeated hearings for the same argument.
```

Buttons:

- Open Existing Case
- Back to My Cases

No paywall.  
No summons.  
No judge assignment reveal.  
No new booking consumed.

---

## 8. Child Conflict Rule

Most child conflict must go through triage before any Friendship Court.

If there is physical violence, repeated verbal abuse, humiliation, threats, fear, bullying, online abuse, or power imbalance, route to:

```text
Child Safety / School Support Pathway
```

Do not create a child-versus-child courtroom or verdict.

---

## 9. Backend Already Updated

Recent backend/mobile files updated:

- `artifacts/api-server/src/routes/cases.ts`
- `artifacts/api-server/src/routes/judge.ts`
- `artifacts/api-server/src/routes/admissions.ts`
- `artifacts/api-server/src/lib/repeatDispute.ts`
- `artifacts/api-server/src/lib/caseSuitability.ts`
- `artifacts/peacemakerai/app/paywall.tsx`
- `artifacts/peacemakerai/app/case/summons.tsx`

Recent checkpoint docs added:

- `COURTROOM_PRIVACY_MODEL.md`
- `BOOKING_CHARGE_POLICY.md`
- `SUMMONS_DESIGN_SPEC.md`
- `REPEAT_DISPUTE_GUARD.md`
- `CHILD_BULLYING_SAFETY_FLOW.md`

---

## 10. Required Testing

Before completion, test:

1. Respondent cannot see claimant raw submissions.
2. Claimant cannot see respondent raw submissions.
3. Both can see judge questions/responses.
4. Raw party messages are not broadcast through SSE.
5. Declined summons closes case without one-sided verdict.
6. Same dispute cannot be refiled after decline.
7. One-off price shows `$2.99`.
8. Product ID is `peacemaker_single_booking_299`.
9. Summons screen is visually premium and non-threatening.
10. Only claimant/respondent can access `/api/cases/:id`.
11. Child bullying/abuse does not enter court.
12. Legal/money/custody/public-figure cases are blocked.

---

## 11. Final Product Principle

PeacemakerAI is not a place to fight.

> It is a private, judge-mediated, consent-based mobile process for settling everyday disputes safely.
