---
name: pr-review
description: Review the current Spontana branch (or a PR number) against the project rules - security, data safety, copy, tests. Use before opening a PR or when asked to review one.
argument-hint: [PR number]
---

# /pr-review

Target: $ARGUMENTS if it's a PR number (`gh pr diff <n>`), otherwise `git diff master...HEAD` plus uncommitted changes.

Read the full diff, then the full files it touches when the diff alone isn't enough context. Check, in this order:

1. **Security** (`.claude/rules/security.md`): new tables without RLS; UPDATE policies that leave privileged columns writable (new `events` columns missing from `guard_event_columns`); policies querying `profiles` directly instead of `is_admin()`; `SECURITY DEFINER` without `search_path` or input checks; service-role keys or secrets in client code or migrations; publicly callable functions that spend quota; unescaped user content in `api/` HTML.
2. **Data safety:** deletes on `events` (cascades into `saved_events`); migrations editing already-pushed files; ingestion treating an empty fetch as success; column changes not reflected in `mapEvent.js`.
3. **Correctness:** dates parsed as UTC; `supabase` used without a null guard; optimistic updates without rollback; missing loading/empty/error states.
4. **Copy:** hard-coded strings; keys missing in `en` or `sv`; tone off-brand (`copy.md`).
5. **Tests:** a bug fix without a regression test; new `src/lib` logic without tests.
6. **Docs:** schema changed but `schema-map.md` didn't; n8n or cron changed but the README didn't.

Report findings most severe first, each with `file:line`, what goes wrong, and a concrete fix. Split them into **must fix** and **worth considering**. Leave out style nits that ESLint would catch. If nothing is found, say so, and list what you checked.

For a PR number with `--comment` in the arguments, post the findings with `gh pr comment <n> --edit-last --create-if-none --body-file -` and the body in a `<<'EOF'` heredoc. CI only allows `gh pr comment` and no file writes, and `--edit-last` updates the previous review instead of stacking a new one.
