# PeacemakerAI — Child Bullying and Physical Violence Flow

**Purpose:** Define how PeacemakerAI handles bullying between children, especially where one child is physically violent and the other child is shy, frightened, or hurt.

---

## Core Rule

A bullying case involving children is not treated like a normal dispute hearing.

If the case involves:

- Children under 13
- Physical violence
- Repeated bullying
- Fear, intimidation, threats, coercion, or serious distress
- A power imbalance
- A child who is shy, hurt, scared, isolated, or unable to self-advocate

then PeacemakerAI must switch to a **Child Safety / School Support Pathway**.

The app must not produce a normal verdict such as:

- “Girl A is guilty”
- “Girl B wins”
- “The bully loses”
- “The court orders punishment”

The app may produce a careful safety-support summary for trusted adults.

---

## Example Scenario

Two 10-year-old girls are involved.

- Girl A is bullying Girl B.
- Girl A has been physically violent.
- Girl B is shy, hurt, and scared.
- The situation may involve school, parents, teachers, and child wellbeing.

This is not a normal PeacemakerAI hearing.

Outcome: **Safety Stop / School Support Pathway**

---

## Correct App Process

### Step 1 — Intake Detection

If the intake says:

> “My 10-year-old daughter is being bullied. The other girl hits her and scares her. My daughter is shy and hurt.”

The Admissions Officer detects:

- Child involved
- Physical violence
- Bullying
- Power imbalance
- Potential ongoing safety risk

Result:

```text
This case cannot proceed as a normal AI courtroom hearing.
Because this involves children, bullying, and physical violence, PeacemakerAI will switch to a child safety and school-support pathway.
```

---

### Step 2 — No Direct Child Courtroom

The app must not place both 10-year-olds into a normal courtroom-style confrontation.

Reasons:

- It could intimidate the shy/hurt child.
- It could worsen the bullying.
- It could publicly label a child as a bully.
- It could interfere with school or safeguarding processes.
- It could put responsibility on children instead of adults.

---

### Step 3 — Adult-Led Support Flow

The app asks the filing adult:

1. Is anyone injured right now?
2. Is the child afraid to attend school or activities?
3. Has this happened more than once?
4. Was the school, teacher, coach, or supervising adult told?
5. Are there messages, screenshots, witness names, or incident dates?
6. Is the child safe tonight?

If immediate danger exists, show emergency help.

If there is no immediate danger, continue to support documentation and school escalation.

---

### Step 4 — Output: Safety-Support Summary

Instead of a verdict, the app generates a private summary for the parent/carer.

Example:

```text
Child Safety Summary

This report describes repeated bullying and physical aggression involving two children aged 10. The affected child is described as shy, hurt, and frightened.

PeacemakerAI cannot decide discipline, punishment, school liability, or legal responsibility. This should be handled by trusted adults and the school’s safety process.

Suggested next steps:
1. Check the child is physically and emotionally safe now.
2. Record dates, locations, witnesses, injuries, and screenshots if relevant.
3. Contact the classroom teacher or school wellbeing/safeguarding lead.
4. Ask the school for a written safety plan separating the children where needed.
5. If violence continues or there is serious harm, contact local emergency or child-safety services.
```

---

## Child-Friendly Mode

If the child uses the app, the wording must be gentle and not legalistic.

Example child-facing wording:

```text
This sounds serious, and you do not have to handle it alone.
Because someone has been physically hurting you, this is not a Friendship Court case.
Please tell a trusted adult now — a parent, carer, teacher, school counsellor, or another safe adult.
You deserve to be safe.
```

The child-facing flow should never pressure the child to confront the other child.

---

## What the AI Judge Should Say

The AI judge should not continue court.

Correct judge response:

```text
Court is paused.
This involves children and physical harm, so this is not suitable for a normal PeacemakerAI verdict.
A trusted adult needs to step in. The priority is safety, documentation, and school support — not deciding a winner.
```

---

## What Must Be Blocked

Do not allow:

- Child-versus-child public verdict cards
- “Bully found guilty” cards
- Shareable verdicts naming or implying a child
- Punishment recommendations
- Legal conclusions
- School liability conclusions
- Advice to physically fight back
- Pressure for the victim child to confront the aggressor child
- Direct unsupervised child-to-child courtroom sessions involving physical bullying

---

## Safe Product Direction

For this category, PeacemakerAI becomes:

> A documentation and adult-escalation support tool, not a judge.

Best feature name:

```text
Safety Support Pathway
```

Alternative child-friendly name:

```text
Get a Safe Adult
```

---

## Build Requirements

1. Add an intake blocker for child + bullying + physical violence.
2. Route the user to Safety Resources / School Support instead of Courtroom.
3. Generate a private incident summary, not a verdict.
4. Disable share cards for child safety cases.
5. Add parent/carer guidance.
6. Add child-friendly guidance.
7. Keep regional resources configurable.
8. Store only necessary data and allow deletion.

---

## Product Principle

When children and physical harm are involved, the goal is not virality, entertainment, or courtroom drama.

The goal is:

> Protect the child, involve safe adults, document what happened, and guide the family toward school or emergency support.
