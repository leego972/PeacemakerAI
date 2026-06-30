# PeacemakerAI — One-Pass Replit Build Instructions

**Platform:** Expo React Native mobile app for iOS and Android.  
**Do not build this as a web-first app.** Web preview may be used only for testing, but every screen must be designed for native mobile behaviour, safe areas, touch targets, app-store compliance, native purchase flows, and phone-sized navigation.

---

## 0. Non-Negotiable Project Direction

Before changing code, read these files and obey them:

1. `PEACEMAKERAI_DIRECTION.md`
2. `CHILD_BULLYING_SAFETY_FLOW.md`

If any requested feature conflicts with those files, do not build it. Build only what supports private, consent-based, everyday dispute resolution.

PeacemakerAI is:

> A private mobile courtroom for everyday interpersonal disputes, producing non-binding fairness verdicts.

PeacemakerAI is not:

- A legal app
- A therapy app
- A court-order app
- A debt or custody app
- A public drama app
- A celebrity/influencer trial app
- A social-media pile-on app
- A child bullying courtroom

---

## 1. Current Mobile Product Goal

Create a visually attractive, viral-ready, easy-to-use iOS/Android experience with this core loop:

1. User opens app.
2. User understands the hook within 3 seconds.
3. User can try a demo or file a case quickly.
4. Admissions screens the case.
5. Unsafe/out-of-scope cases are redirected.
6. Eligible cases get a judge assignment.
7. User unlocks hearing through IAP if needed.
8. User sends a private summons.
9. Other person voluntarily accepts, declines, blocks, or reports.
10. Courtroom runs.
11. Judge gives a non-binding fairness verdict.
12. Both parties can tap Fair Call.
13. Users may generate a redacted share card only for safe eligible cases.

---

## 2. Mobile-First UX Principles

Build for phones first.

Required mobile rules:

- Use safe-area-aware layouts on every screen.
- Use large thumb-friendly buttons, minimum 44px height.
- Primary CTA should sit within thumb reach near the bottom.
- Avoid dense text walls; use progressive disclosure.
- One main task per screen.
- Use native scrolling and keyboard-safe layouts.
- Preserve unfinished intake drafts when the user leaves and returns.
- Use haptics sparingly for major actions: summons sent, court opens, verdict delivered.
- Avoid hover states or desktop-only affordances.
- Avoid web landing page sections inside the app.
- Keep bottom tab navigation clean and minimal.

Screen density rule:

> If a screen has more than one primary action, simplify it.

---

## 3. Visual Design System

Keep the existing brand language, but sharpen it for mobile virality.

### Palette

- Background: deep navy / courtroom black-blue
- Surface card: slightly lighter navy
- Primary: gold / amber
- Primary text: ivory / white
- Muted text: cool grey-blue
- Safety danger: red, used only for safety resources
- Success/resolution: restrained green, used only for Fair Call/resolved states
- Viral accent: controlled electric blue or warm coral only for summons/share moments

Do not make the whole app bright or childish. Child mode can soften the tone, but the main app stays premium, calm, and courtroom-like.

### Typography

- Use Inter throughout.
- Use large short headlines.
- Avoid legal jargon.
- Use sentence case, not all-caps except small labels.

### Component style

- Rounded cards: 16–24 radius
- Subtle 1px borders
- Soft shadows only where supported cleanly
- Feather icons only
- No emojis anywhere in UI
- Judge portraits as central brand assets
- Clear hierarchy: title, explanation, CTA, secondary action

---

## 4. Viral UI Patterns to Build

Use proven mobile growth design patterns but keep them ethical.

### Fast activation

The first screen must communicate the app in one line:

> Settle the argument. Let the AI judge decide.

Primary CTA:

> File a Case

Secondary CTA:

> Try Demo Case

Do not lead with a long explanation.

### Progressive disclosure

Do not show the entire case form at once. Split intake into cards:

1. Who is this with?
2. What type of dispute is it?
3. What happened?
4. What do you want the judge to decide?
5. Confirm safety and private connection

### Emotional ownership before payment

Best paywall timing:

1. User writes case.
2. Admissions accepts.
3. Judge is assigned.
4. Paywall appears: “Unlock the Hearing.”

Do not block before the user understands their case is accepted.

### Share loop

After a safe eligible verdict, generate a redacted share card:

- No real names
- No handles
- No children
- No locations
- No abuse/safety content
- No legal/money/custody matters

Copy example:

> The Court Has Ruled  
> Case: The Forgotten Dinner  
> Verdict: One apology overdue.  
> Court is adjourned.

### Judge mascots

Judges are brand assets. Make them memorable, not generic.

- Dorothy: sassy, no-nonsense
- James: formal, English barrister
- Maggie: meticulous, glasses, procedural
- Karl: reflective, empathetic
- Edward: pragmatic, direct

Show judge portrait, name, tagline, and voice style before the hearing.

---

## 5. Required Screens

Build or polish these screens in this order:

### 1. Welcome

Purpose: instant hook.

Layout:

- Judge portrait carousel or single strong judge image
- App name
- One-line hook
- Two CTAs
- Safety/legal footer

Copy:

```text
Settle the argument.
Let the AI judge decide.
```

Subcopy:

```text
A private mobile courtroom for everyday disputes. Non-binding, consent-based, and built for fairness.
```

Buttons:

- File a Case
- Try Demo Case

Footer:

```text
Not legal advice. Not for emergencies, abuse, custody, debts, or court matters.
```

### 2. Dashboard / My Cases

Purpose: simple case control centre.

Cards:

- Active cases
- Waiting for response
- Verdict ready
- Resolved
- Safety/support cases

Primary CTA:

- File a Case

No clutter. No marketplace, no feed, no unrelated features.

### 3. File a Case Intake

Use 5 progressive steps.

Step 1: Relationship type

Options:

- Partner
- Ex-partner
- Friend
- Family
- Housemate
- Classmate
- Teammate
- Group member
- Co-parent communication only

Step 2: Case type

Options:

- Relationship disagreement
- Friendship issue
- Group disagreement
- Household/chores
- Communication/tone
- Plans/lateness/reliability
- School friendship issue
- Co-parent communication only

Step 3: What happened?

Text area. Add helper:

```text
Keep it factual. Avoid private addresses, full names, legal claims, or sensitive child details.
```

Step 4: What do you want the judge to decide?

Text area. Add helper:

```text
Ask for a fairness view, not a legal ruling.
```

Step 5: Safety and consent confirmations

Checkboxes:

- I personally know this person.
- This is a private everyday dispute.
- The other person can freely accept, decline, block, or report.
- This is not about legal rights, money owed, custody, child safety, abuse, threats, or emergency danger.

Submit button:

- Screen Case

Call:

```http
POST /api/admissions/screen
```

Include:

```json
{
  "relationshipType": "friend",
  "courtType": "friend",
  "title": "Case title",
  "openingArgument": "What happened",
  "personalConnectionConfirmed": true
}
```

### 4. Admissions Result

If accepted:

```text
Case accepted.
Judge Maggie has been assigned.
```

Button:

- Continue to Hearing

If blocked:

Show route-specific screen:

- Safety Resources
- Child Safety / School Support
- Outside Scope
- Public Targeting Blocked
- Consent Required

Never just show “error.” Explain calmly.

### 5. Paywall

Use current IAP ladder:

- Book One Hearing — USD $1.99
- Unlimited Monthly — USD $6.99/month
- Unlimited Annual — USD $49.99/year

RevenueCat products:

- `peacemaker_single_hearing_199`
- `peacemaker_unlimited_monthly_699`
- `peacemaker_unlimited_annual_4999`

Entitlement:

- `premium`

Headline:

```text
Unlock the Hearing
```

Subcopy:

```text
Present both sides, enter the private courtroom, and receive a non-binding fairness verdict.
```

Make the one-off hearing the default selected option for new users. Make annual visually tagged as “Best value.”

### 6. Summons

Purpose: viral private invite.

Copy:

```text
You have been summoned to PeacemakerAI.
Someone you know has filed a private fairness case and is asking you to respond.
```

Respondent buttons:

- Accept Summons
- Decline
- Block User
- Report Concern

Do not imply guilt. Do not say “you are accused.”

### 7. Courtroom

Purpose: ceremonial but simple.

Layout:

- Judge header: portrait, name, court type
- Case status chip
- Chat messages
- Input field pinned above keyboard
- Safety/report button accessible but not dominant

Judge message style:

- Distinct card/bubble with gold border
- Short questions
- No legal jargon

User message style:

- Claimant/respondent labels
- Clear separation

Verdict trigger:

- When judge says “Court is adjourned,” transition to Verdict screen.

### 8. Verdict

Headline:

```text
Fairness Verdict
```

Subcopy:

```text
Non-binding. Based only on what was said in this private hearing.
```

Buttons:

- Fair Call
- Save Verdict
- Create Redacted Share Card
- Close Case

Disable share card if category is child_welfare, safety, legal, money, parenting, property, professional, or public_figure.

### 9. Child Safety / School Support

This is not a courtroom.

Title:

```text
This needs adult support
```

Copy:

```text
Because this involves a child and possible harm, PeacemakerAI will not run a hearing or issue a verdict. The priority is safety, documentation, and trusted adult support.
```

Actions:

- Create Incident Summary
- School Support Checklist
- Safety Resources
- Close

### 10. Safety Resources

Must include region-aware emergency categories:

- Immediate danger
- Domestic/family violence
- Child safety
- Self-harm/crisis
- Men’s support
- Online safety/cyberbullying

No judge visuals here. Use calmer safety design.

---

## 6. Backend Already Added / Must Use

The backend now includes:

- `artifacts/api-server/src/lib/caseSuitability.ts`
- `artifacts/api-server/src/routes/admissions.ts`
- Updated `artifacts/api-server/src/routes/index.ts`
- Updated `artifacts/api-server/src/routes/cases.ts`
- Updated `artifacts/api-server/src/routes/judge.ts`
- Updated `artifacts/api-server/src/middlewares/rateLimit.ts`

Use these behaviours:

### Admissions endpoint

```http
POST /api/admissions/screen
```

Accepted response:

```json
{
  "accepted": true,
  "route": "courtroom",
  "category": "eligible",
  "reason": "This appears suitable for a private non-binding fairness hearing."
}
```

Blocked response:

```json
{
  "accepted": false,
  "route": "child_safety_school_support",
  "category": "child_welfare",
  "reason": "...",
  "redirect": "..."
}
```

Routes to handle:

- `courtroom`
- `consent_required`
- `safety_resources`
- `child_safety_school_support`
- `public_targeting_blocked`
- `outside_scope`

### Case creation

```http
POST /api/cases
```

Must include:

```json
{
  "personalConnectionConfirmed": true
}
```

If missing, backend rejects.

### Judge messages

```http
POST /api/judge/:caseId/message
```

Backend now re-checks message suitability, not only initial intake.

---

## 7. Safety and Compliance Requirements

### Apple App Store

Apple requires apps with user-generated content to include filtering, reporting, blocking, timely response to concerns, and published contact information. Apple also warns that apps used for bullying, threats, or objectification of real people may be removed.

Therefore implement:

- Report user
- Block user
- Safety stop
- Filtering/suitability before posting
- Contact/support screen
- Clear terms and privacy links
- Demo account or demo mode for App Review

### Google Play

Google Play UGC policy identifies threats, harassment, bullying, and content targeting another person for abuse/ridicule as common violations. The app must not become a place for harassment or public shaming.

Therefore implement:

- No public targeting
- No celebrity/influencer summons by handle
- No public child dispute cards
- No unsafe monetization incentives
- No rewards for starting conflict
- Accurate Data Safety disclosures

---

## 8. Viral But Safe Growth Mechanics

Build these:

1. Private summons card
2. Judge assignment reveal
3. Redacted verdict card
4. Demo case
5. Case templates
6. Fair Call resolution moment
7. Judge persona carousel

Do not build:

- Public leaderboards
- Win/loss records
- “Bully guilty” cards
- Public trials
- Celebrity disputes
- “Destroy them in court” copy
- Streaks for starting arguments

Use “resolution gamification” only:

- Case resolved
- Fair Call accepted
- Communication improved
- Cooling-off used
- Apology delivered

---

## 9. Mobile Navigation Structure

Use bottom tabs:

1. Cases
2. File
3. Demo
4. Profile

Optional later:

5. Resources

Do not overload the tab bar.

Stack screens:

- `/case/new`
- `/case/admissions-result`
- `/case/summons`
- `/case/courtroom`
- `/case/verdict`
- `/support/safety`
- `/support/child-school`
- `/paywall`

---

## 10. UI Polish Details

### Microcopy

Use:

- “Fairness verdict”
- “Private hearing”
- “Summons”
- “Fair Call”
- “This is outside PeacemakerAI’s scope”
- “This needs adult support”

Avoid:

- “Legal ruling”
- “Guilty”
- “Punishment”
- “Court order”
- “Custody decision”
- “Debt owed”
- “Public trial”

### Motion

Use light motion:

- Judge assignment reveal fade/scale
- Summons card slide-up
- Verdict card ceremonial reveal
- Haptic tap on Fair Call

No distracting animations during safety screens.

### Accessibility

- High contrast text
- Dynamic type where possible
- Screen reader labels
- Do not rely on colour alone for blocked/safety states
- Minimum 44px tap targets

---

## 11. RevenueCat Setup Instructions

Configure RevenueCat offerings:

Offering: `default`

Packages:

1. Single hearing
   - Product ID: `peacemaker_single_hearing_199`
   - Price: USD $1.99
   - Type: one-off purchase / consumable or non-renewing unlock depending implementation

2. Monthly unlimited
   - Product ID: `peacemaker_unlimited_monthly_699`
   - Price: USD $6.99/month
   - Entitlement: `premium`

3. Annual unlimited
   - Product ID: `peacemaker_unlimited_annual_4999`
   - Price: USD $49.99/year
   - Entitlement: `premium`

Native mobile rule:

- Use RevenueCat native SDK in Expo dev build / production build.
- Do not build payments as web checkout for iOS/Android digital features.

---

## 12. Testing Checklist

Run these before considering the pass complete:

### Backend

- `pnpm install`
- `pnpm run typecheck`
- `pnpm run build`

### Mobile

- Launch iOS simulator/device
- Launch Android emulator/device
- Confirm keyboard does not cover chat input
- Confirm safe area on iPhone notch devices
- Confirm Android back button behaviour
- Confirm RevenueCat offerings load
- Confirm blocked cases route correctly
- Confirm child bullying case does not enter courtroom
- Confirm public figure case is blocked
- Confirm legal/money/custody cases are blocked
- Confirm normal friendship/couple dispute can proceed
- Confirm respondent can decline
- Confirm blocked/reported states do not create public verdicts

---

## 13. Acceptance Criteria

The build is acceptable only if:

1. App feels clearly mobile-native.
2. Welcome screen explains the app in under 3 seconds.
3. Case filing uses progressive steps.
4. Admissions screening happens before payment and before summons.
5. Dangerous/out-of-scope matters are redirected, not judged.
6. Child bullying/verbal/physical abuse routes to support, not court.
7. Public figure targeting is blocked.
8. Paywall shows the three approved IAP options.
9. Courtroom is clean, readable, and ceremonial.
10. Verdicts are clearly non-binding fairness observations.
11. Share cards are redacted and disabled for unsafe categories.
12. No emojis appear in UI.
13. No unrelated features are introduced.

---

## 14. Final Instruction To Replit Agent

Build only the mobile app experience described here. Keep it simple, polished, safe, and viral-ready. Do not add speculative features. Do not redesign the product into a legal platform, therapy platform, generic social network, or public controversy app.

The mission is:

> Funny enough to share. Serious enough to trust. Safe enough for real conflict.
