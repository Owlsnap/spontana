# Security

Threat model: the anon key and every RPC are public. Anyone can call PostgREST directly with a logged-in session. Client-side checks are UX only.

- **RLS row checks don't limit columns.** An UPDATE policy of `created_by = auth.uid()` lets the owner change *every* column, including `status`, `source` and `view_count`. Protect privileged columns with a BEFORE UPDATE trigger, or move the writes into a `SECURITY DEFINER` RPC. (Lesson from 017: users could set their own `role = 'admin'`.)
- **Admin checks in policies go through `is_admin()`** (020). A policy that queries `profiles` directly recurses through profiles RLS and breaks every query that touches it.
- **BEFORE triggers that normalize a row beat policies alone.** `guard_event_columns` (021) forces `source`/`status`/`created_by`/`view_count` on user inserts and rejects changes to them on updates. New privileged columns on `events` go into that guard.
- **Moderation and roles are server-side.** `status`, `role` and `created_by` must never be trusted from the client.
- **Edge functions are publicly callable.** Anything that spends a quota (Ticketmaster) or writes with the service role must check a shared secret or a JWT role, not just exist at an unguessable URL.
- **Service role key**: only in edge function secrets and n8n credentials. Never in `src/`, `api/`, or `VITE_*` variables (Vite inlines those into the bundle).
- **Tokens in links** (`email_token`) act as credentials: random UUIDs, resolved only through RPCs, never logged.
- **User content** (event names, descriptions, image URLs) gets rendered without `dangerouslySetInnerHTML`. Escape it in `api/event.js` HTML templates. Only `http(s)` URLs go into `href`/`src`.
- **Rate limits** live in RLS or RPCs (see 011), not the UI.
- **Privacy**: new personal data or a new sub-processor means updating `src/components/Privacy/Privacy.jsx` in both languages.
