---
name: harden
description: After a Spontana bug is fixed, make sure it can't come back - add a regression test, rule, or skill update. Use after any bug fix or when a review catches a repeated mistake.
argument-hint: [what went wrong]
---

# /harden: never fix the same bug twice

Input: $ARGUMENTS, or the bug fixed most recently in this conversation or branch.

1. **Name the root cause** in one sentence: the reason it was possible, not the symptom. "RLS UPDATE policy checks the row owner but not which columns change", not "user could approve own event".
2. **Pick the cheapest guard that would have caught it**, in order of preference:
   - A unit test that fails without the fix.
   - A database guard (constraint, trigger, RPC) so the bad state can't exist.
   - A line in the matching `.claude/rules/*.md` file, phrased as a check a reviewer can apply.
   - A new check in the `pr-review` skill's list.
3. **Search for siblings:** grep for the same pattern elsewhere (other tables, other functions, other components). List them for the user and fix them with confirmation.
4. Keep rule additions to one or two lines. If a rule file grows past ~40 lines, propose merging or pruning instead.
5. Report: root cause, guard added, siblings found.
