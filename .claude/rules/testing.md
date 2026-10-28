---
paths:
  - "**/*.test.js"
  - "**/*.test.jsx"
  - "src/lib/**"
  - "vitest.config.js"
---

# Testing

- Vitest, `npm test`. Tests sit next to the code: `foo.js` → `foo.test.js`.
- TZ is pinned to `Europe/Stockholm` in `vitest.config.js`. Pass `today` explicitly to date helpers instead of mocking the clock.
- Priorities: pure logic in `src/lib/` and `api/` helpers first, then ingestion mappers (fixture in, rows out), then components.
- A bug fix comes with a test that fails without the fix.
- Name tests by behavior: `it('keeps a missing spot count null instead of 0')`.
- No network in unit tests. Ingestion parsers get a saved HTML/JSON fixture.
- Database behavior (RLS, triggers): SQL scripts in `supabase/tests/`, run against the local stack after `supabase db reset`. Each script runs in one transaction, ends with `ROLLBACK`, and prints a PASS/FAIL row per check. Test as anon, as another user, as the owner, as an admin, and as the service role. See `event_moderation.sql`.
