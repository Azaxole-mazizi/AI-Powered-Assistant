## Global Language Switching System

Add app-wide i18n so changing the language in Settings instantly translates the entire UI and steers all AI responses into that language. Preference persists in the `profiles` table (already has `language` column) and rehydrates on every login/device.

### Supported languages
English (en), Afrikaans (af), isiZulu (zu), isiXhosa (xh), French (fr), Spanish (es), Portuguese (pt), German (de), Arabic (ar) [RTL], Chinese (zh), Japanese (ja). Default: English.

### Approach

**1. i18n runtime (`react-i18next`)**
- Add `i18next`, `react-i18next`, `i18next-browser-languagedetector`.
- New `src/lib/i18n.ts` initializes i18next with all 11 locales, loads JSON resource bundles from `src/locales/<lang>/common.json`, falls back to `en`.
- Import once in `src/routes/__root.tsx`. Wrap nothing — `react-i18next` works via hook globally.

**2. Translation bundles (`src/locales/<lang>/common.json`)**
- One flat JSON per language with keyed strings grouped by surface: `nav.*`, `actions.*`, `auth.*`, `settings.*`, `dashboard.*`, `tasks.*`, `meetings.*`, `email.*`, `research.*`, `reports.*`, `history.*`, `chat.*`, `common.*`, `errors.*`, `toasts.*`, `priority.*`, `status.*`, `burnout.*`.
- English file is the source of truth; other 10 languages mirror the same keys with translations (including the examples: Dashboard → Beheerpaneel / Ideshibhodi, Settings → Instellings / Izilungiselelo, etc.).

**3. Language state + persistence**
- New `src/components/language-provider.tsx`: on mount, reads `profile.language` (via existing `getProfile` server fn when authenticated, else `localStorage` fallback, else browser), calls `i18n.changeLanguage()`, sets `<html lang>` and `dir="rtl"` for Arabic.
- Mount inside `__root.tsx` so it runs on every route (public + authenticated).
- Settings save already writes `profiles.language`. After save, also call `i18n.changeLanguage(form.language)` and update `localStorage` — switch is instant, no refresh.
- On sign-in (auth state change), refetch profile and re-apply language.

**4. UI translation pass**
- Replace hardcoded strings with `t("…")` across:
  - `app-shell.tsx` (nav labels, AI-powered badge, Sign out).
  - `settings.tsx` (all card titles, labels, placeholders, button text).
  - Page headers + key buttons/labels on `dashboard`, `tasks`, `meetings`, `email`, `research`, `reports`, `history`, `chat` index/thread, `auth`, landing `index`.
  - Toasts (`Signed out`, `Preferences saved`, generic error messages).
  - Dynamic labels: priorities (`critical/high/medium/low`), task statuses (`todo/in_progress/done`), burnout levels, productivity-score band labels, chart axis/legend strings.
- Keep user-generated data (task titles, emails, transcripts) untranslated — only labels/chrome are translated.

**5. AI response language**
- `src/routes/api.chat.ts`: read caller's `profiles.language` after auth, append `Respond in <language name>. Never switch languages unless the user explicitly asks.` to the system prompt. Pass the language code through so the model honors it.
- `src/lib/ai.functions.ts`: in each AI helper (email generation, meeting analysis, productivity insights, goal breakdown, research summary), fetch `profile.language` from context and inject the same instruction into the prompt. Structured-JSON outputs keep their schema keys in English, but human-readable string values (summary, insights, recommendations, body, subject) come back in the chosen language.

**6. RTL support**
- `LanguageProvider` toggles `document.documentElement.dir = "rtl"` when `ar`, otherwise `ltr`. Tailwind's logical utilities already in shadcn components handle most layout; no further changes required.

### Files to create
- `src/lib/i18n.ts`
- `src/components/language-provider.tsx`
- `src/locales/{en,af,zu,xh,fr,es,pt,de,ar,zh,ja}/common.json` (11 files)

### Files to edit
- `package.json` (add deps)
- `src/routes/__root.tsx` (init i18n + mount LanguageProvider)
- `src/components/app-shell.tsx` (translate nav + sign out)
- `src/components/page-header.tsx` (pass-through, no change needed)
- `src/routes/_authenticated/{settings,dashboard,tasks,meetings,email,research,reports,history,chat.index,chat.$threadId}.tsx`
- `src/routes/{index,auth}.tsx`
- `src/routes/api.chat.ts` (language-aware system prompt)
- `src/lib/ai.functions.ts` (language-aware prompts in every AI helper)

### Out of scope
- Translating already-generated historical reports/emails stored in DB (kept as-is; the spec says "Existing reports can be translated on demand" — left for a future "Translate" button per record).
- No new DB migration: `profiles.language` already exists.
