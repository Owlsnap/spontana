---
status: draft  # draft | ready | in-progress | done
issue:
---

# <Feature name>

## Why
One paragraph. Who wants this, and what happens today without it.

## Outcome
What is true when this ships. Observable, not implementation.

## Scope
- In:
- Out (and why):

## Acceptance criteria
- [ ] Given … when … then …

## Design
- **Data:** tables/columns/RPCs added or changed, RLS for each.
- **Backend:** edge functions, cron, n8n.
- **Frontend:** components, routes, states (loading, empty, error).
- **Copy:** every new string, `en` and `sv`.

## Risks
Security (anon-key attacker), data loss/cascades, privacy, cost (API quotas, email volume).

## Testing approach
TDD / tests alongside / tests after / none, plus why. What gets unit-tested, what gets verified by hand or SQL.

## Tasks
Filled in by `/breakdown`.
