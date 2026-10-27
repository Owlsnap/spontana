---
paths:
  - "src/**"
---

# Frontend

- One folder per component: `src/components/Name/Name.jsx` + `Name.css`. Function components and hooks only.
- Styling: plain CSS. Use the tokens in `src/index.css` (`--color-*`, `--font-*`) instead of hard-coded hex values. The look is dark and neon (`BRAND.md`), but not over the top. Check at 375px width.
- Text: `const { t } = useLanguage()` and `t('section.key', { count })`. Never inline user-facing strings. Add keys to both `en` and `sv` in `src/i18n/translations.js`.
- Data: import `supabase` from `src/lib/supabase.js`. It can be `null` when env vars are missing, so guard it, and fall back to `src/data.json` where reads already do. Convert rows only through `dbRowToEvent` / `eventToDbRow`.
- Dates: `src/lib/eventDates.js` helpers. Format with `Intl.DateTimeFormat` and the current language's locale.
- Auth: `useAuth()` from `AuthContext`. Protect routes with `RequireAuth` / `RequireAdmin` in `App.jsx`, and treat that as UX only (`security.md`).
- Loading: `Skeleton` components. Feedback: `toast` from `sonner`. Error copy follows `copy.md`.
- Event SEO: `buildEventSeo` in `src/lib/eventSeo.js` is shared with `api/event.js`, so change both sides together.
- Optimistic updates (see MyEvents delete + Undo) roll back on error.
- Pure logic (formatting, mapping, filtering) goes in `src/lib/` with a `*.test.js` next to it.
