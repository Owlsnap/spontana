---
name: prd
description: Write a feature spec for Spontana into specs/. Use when starting a feature that touches more than a couple of files, the database, or user-facing copy.
argument-hint: <feature idea or issue number>
disable-model-invocation: true
---

# /prd: spec a feature

Input: $ARGUMENTS (an idea, or a GitHub issue number to fetch with `gh issue view`).

1. **Understand before writing.** Read the code the feature touches, `CLAUDE.md`, and the relevant `.claude/rules/`. Check `specs/` for overlapping work.
2. **Ask only what blocks the spec.** At most 3 questions, each with a recommended answer. Skip questions the code already answers.
3. **Write `specs/<yyyy-mm-dd>-<slug>.md`** from `specs/_template.md`. Fill every section; write "n/a" with a reason rather than deleting one.
4. **Stress-test it yourself**, then add what you find to the spec:
   - What can an attacker do with only the anon key? (`security.md`)
   - What does an empty, slow or failing Supabase do to this?
   - Does it touch `events` rows that ingestion deletes, or anything that cascades?
   - Is there new copy? Draft it in both `en` and `sv` in the spec.
5. Show the user a short summary (goal, scope, open questions) and the path. Don't start implementing. Next step is `/breakdown`.
