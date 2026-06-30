# PeacemakerAI — Booking Charge Policy

**Purpose:** Define how PeacemakerAI charges one-off users and members when a dispute booking is attempted.

---

## Core Rule

A one-off booking is charged for the eligible booking attempt, not only for a completed verdict.

The booking is considered consumed when:

1. The case passes admissions/suitability screening.
2. The user confirms the case is a private everyday dispute.
3. The user pays for the one-off booking.
4. The summons is sent to the other party.

If the invited person later declines, ignores the summons, blocks the filer, or lets the summons expire, the one-off booking remains consumed.

Reason:

- The user paid to initiate a private dispute-resolution booking.
- The app screened the case, assigned the booking flow, created the summons, notified the other person, and held the case open.
- The app cannot control whether the other person voluntarily accepts.
- Refunding declined cases would encourage summons spam and repeated pressure attempts.

---

## Launch Pricing

Approved one-off price:

```text
USD $2.99 per booking attempt
```

RevenueCat product ID:

```text
peacemaker_single_booking_299
```

Label:

```text
Book One Hearing — $2.99
```

Plain-language description:

```text
One eligible booking attempt. Charged once the summons is sent.
```

---

## Subscription Pricing

Monthly membership:

```text
USD $6.99/month
```

RevenueCat product ID:

```text
peacemaker_unlimited_monthly_699
```

Annual membership:

```text
USD $49.99/year
```

RevenueCat product ID:

```text
peacemaker_unlimited_annual_4999
```

Membership rule:

> Members get unlimited eligible booking attempts and hearings, subject to safety, suitability, anti-spam, repeat-dispute, and abuse controls.

Unlimited does not mean unrestricted. The system must still block:

- Repeat disputes
- Legal/custody/money matters
- Public-figure targeting
- Abuse or safety cases
- Child welfare cases requiring adult/school support
- Harassment/spam summons

---

## Why $2.99 Instead of $1.99

Use $2.99 because:

1. It is still a low-friction impulse purchase.
2. It gives the booking more perceived value.
3. It covers more AI, server, moderation, and platform-fee cost.
4. It makes the $6.99 monthly plan more attractive after three booking attempts.
5. It discourages frivolous spam filings more than $1.99.

Pricing anchor:

- 1 booking = $2.99
- 2 bookings = $5.98
- 3 bookings = $8.97
- Monthly unlimited = $6.99

Therefore, after two to three uses, the monthly plan becomes the obvious better value.

---

## Refund and Decline Policy Wording

Show this before purchase:

```text
Your booking is used when the summons is sent. If the other person declines or does not respond, the booking remains used. Members receive unlimited eligible bookings.
```

Short version for paywall card:

```text
Charged once summons is sent.
```

Do not use aggressive wording like:

- No refunds ever
- You lose your money
- Declines are your problem

Use calm and clear wording.

---

## Correct Flow for One-Off Purchase

1. User completes intake.
2. Admissions screens the case.
3. If blocked, no charge.
4. If accepted, show judge assignment preview.
5. Show paywall.
6. User buys `peacemaker_single_booking_299`.
7. App sends summons.
8. Mark booking as consumed.
9. If respondent accepts, continue to private judge-mediated courtroom.
10. If respondent declines/expires, close as declined/expired and do not refund automatically.
11. Repeat-dispute guard prevents the same case being re-filed again.

---

## Correct Flow for Member

1. User completes intake.
2. Admissions screens the case.
3. If blocked, no hearing.
4. If accepted, no one-off charge required.
5. App sends summons.
6. If respondent accepts, continue to private judge-mediated courtroom.
7. If respondent declines/expires, close as declined/expired.
8. Repeat-dispute guard still prevents refiling the same argument.

---

## Backend Requirements

Future backend build should add persistent booking records.

Suggested table:

```text
bookings
```

Suggested fields:

- `id`
- `userId`
- `caseId`
- `relationshipId`
- `purchaseType` — `single_booking` or `membership`
- `revenueCatProductId`
- `revenueCatTransactionId`
- `status` — `pending`, `consumed`, `declined_after_summons`, `expired_after_summons`, `completed`, `blocked_before_payment`
- `consumedAt`
- `createdAt`
- `updatedAt`

Policy:

- Do not consume a booking before admissions acceptance.
- Do not consume a booking before payment succeeds.
- Consume once summons is sent.
- Do not consume if the case is blocked before payment.
- Do not allow repeat dispute after decline to create a free second booking attempt.

---

## Product Principle

PeacemakerAI charges for the private booking attempt, while still respecting voluntary participation.

> The filer may book the process. The respondent may decline the process. The same dispute cannot be recycled for free pressure attempts.
