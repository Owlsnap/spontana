---
name: breakdown
description: Split a Spontana spec in specs/ into ordered, independently verifiable tasks with a chosen testing approach.
argument-hint: <spec path>
disable-model-invocation: true
---

# /breakdown: spec → tasks

Input: $ARGUMENTS, a spec path. If it's empty, use the most recent `status: ready` or `draft` spec in `specs/`.

1. Read the spec and the code it touches. If the acceptance criteria are vague, fix that with the user first.
2. **Ask the testing approach** if the spec doesn't set it: TDD, tests alongside, tests after, or none (docs/config/prototype). Recommend one based on risk: data, security and date logic deserve tests first.
3. Write tasks into the spec's `## Tasks` section as a checklist, in dependency order:
   - Migrations first, then backend (edge functions, RPC callers), then frontend, then copy and docs.
   - Each task is small enough for one commit, and says **which files** and **how to verify it** (test name, SQL query, or what to click).
   - Mark tasks that can run in parallel with `(parallel)`.
   - Finish with a task for updating `schema-map.md`, `CLAUDE.md` or `n8n/README.md` if they change.
4. Set the spec's `status: ready`. Tell the user the task count and the first task. Next step is `/build`.
