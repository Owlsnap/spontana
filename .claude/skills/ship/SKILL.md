---
name: ship
description: Verify the Spontana branch, push it and open a PR into master.
disable-model-invocation: true
---

# /ship

1. **Branch check:** not on `master`. Working tree is committed, or ask what to do with the leftovers.
2. **Verify:** `npm test` and `npm run build` must pass. Run `npx eslint` on changed files and make sure no new errors appear. Stop and report if anything fails.
3. **Review:** if `/pr-review` hasn't run on the current HEAD in this session, run it. Fix the must-fix findings, or confirm with the user before shipping with them.
4. **Push:** `git push -u origin <branch>`.
5. **PR:** `gh pr create --base master` using `.github/pull_request_template.md`. Fill in:
   - What and why (link the spec and issue).
   - How it was verified: test names, SQL queries, browser checks.
   - **Deploy steps** if any: `supabase db push`, `supabase functions deploy <name>`, n8n re-import, new secrets or Vault entries. Leave it blank only when there are none.
6. If the PR completes a spec, set its `status: done`.
7. Reply with the PR URL and any deploy steps the user has to run.
