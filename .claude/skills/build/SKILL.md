---
name: build
description: Implement the tasks of a Spontana spec one by one, verifying each before moving on.
argument-hint: <spec path> [task number]
disable-model-invocation: true
---

# /build: implement a spec

Input: $ARGUMENTS, a spec path, optionally a task number to start from.

**Before the first task**
- Make sure you're on a feature branch (`feat/<slug>`, not `master`). Create it if not.
- Set the spec's `status: in-progress`.

**For each unchecked task**
1. Read the files involved and the rules that apply to them.
2. Follow the spec's testing approach. For TDD, write the failing test first and run it to see it fail.
3. Implement the smallest change that meets the task. Match the surrounding code. Don't refactor beyond the task; note it under the spec's `## Risks` instead.
4. Verify the way the task says: `npm test`, plus SQL for migrations, plus a browser check for UI.
5. Tick the task in the spec and commit (`feat: …` / `fix: …`, one task per commit).
6. If a task turns out wrong or blocked, stop and tell the user. Don't work around the spec silently.

Independent `(parallel)` tasks can go to subagents when there are several. Give each one the spec path, its task, and the rule files.

**When all tasks are done:** run `npm test`, `npm run build`, and `npx eslint` on the changed files. Report what was verified and how. Next step is `/pr-review`.
