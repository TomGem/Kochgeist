# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Kochgeist — AI-powered recipe suggestion app. Users enter ingredients, an AI suggests 4 recipes with generated images. Multilingual (EN/DE/FR/IT/ES/PT). Located in `kochgeist/`.

## Commands

All commands run from `kochgeist/`:

```sh
npm run dev          # Dev server at localhost:4321
npm run build        # Production build to dist/
npm run preview      # Preview production build
npm run db:generate  # Generate Drizzle migrations from schema
npm run db:push      # Push schema changes to SQLite DB
```

No test framework is configured.

## Architecture

**Astro SSR** with Node adapter (`output: 'server'`). No SPA framework — uses **htmx** for server interactions and **Alpine.js** for client-side state.

### Request flow
1. Middleware (`src/middleware/index.ts`) runs four middleware in sequence: security headers, CSRF protection (validates origin for non-safe methods), language detection (sets `context.locals.lang`), then auth (validates session cookie, sets `context.locals.user`/`context.locals.session`, enforces route protection)
2. If no users exist in DB, middleware redirects all routes to `/register?setup=true` (first-user bootstrap)
3. Pages render Astro components; interactive parts use htmx (`hx-get`, `hx-post`, `hx-swap`) targeting partials
4. API routes in `src/pages/api/` handle recipe suggestion, bookmarks, history, image generation, auth, and admin operations
5. htmx partials in `src/pages/partials/` return HTML fragments (recipe detail, bookmark grid, image slots)
6. Recipe detail modal is opened via Alpine `x-init="$store.ui.modalOpen = true"` inside the partial itself (not via afterSwap events)

### Authentication & multi-user
- Cookie-based sessions stored in SQLite (`sessions` table), 30-day expiry
- `src/lib/auth/` — password hashing (bcrypt), session CRUD, email sending (nodemailer), token generation, first-user detection
- Registration requires an invitation code (entered on `/register` form) except for the first user (`/register?setup=true` — becomes admin)
- Invitation codes are short, readable format (`ABCD-1234`), generated in admin panel with configurable expiry date and max uses
- Email verification via 6-digit code after registration
- Password reset via email token link
- Route protection in middleware: only auth pages (`/login`, `/register`, `/forgot-password`, `/reset-password`) are public; all other routes require authentication; admin routes (`/admin`, `/api/admin/*`) require admin role
- Bookmarks and search history are user-scoped (`userId` column); recipe cache and recipes are shared across all users
- Admin panel at `/admin`: generate invitation codes (with expiry date picker and max uses), manage users (promote/demote, verify), configure AI/image providers and models at runtime
- Auth pages: `/login`, `/register`, `/register/verify`, `/forgot-password`, `/reset-password`
- User settings at `/settings`: language preference, default dietary filters
- SMTP config in `.env` for emails; falls back to console logging in dev

### AI provider system
- `src/lib/ai/provider.ts` — `AIProvider` interface with `generateRecipes()`, `recognizeIngredients()`, and `listModels()`
- `src/lib/ai/registry.ts` — lazy-loads provider based on runtime settings (DB) or `AI_PROVIDER` env var fallback (azure/openai/anthropic/ollama/lmstudio); cache is cleared when settings change
- `src/lib/ai/providers/` — one implementation per provider
- `src/lib/ai/prompts/` — shared prompt templates and Zod schema for structured AI output
- AI response parsing is lenient: handles `{ "recipes": [...] }`, any object wrapping an array of recipe objects, or a single recipe object. All providers share this logic.
- Azure provider uses `max_completion_tokens` (not `max_tokens`) for newer models (gpt-5.4+)
- Each recipe stores `aiProvider`, `aiModel`, and `aiGenerationTimeMs` for provenance tracking; displayed in recipe detail

### Image generation
- Separate provider system: `src/lib/images/provider.ts` (interface with `listModels()`), `src/lib/images/queue.ts` (generation + DB writes)
- Provider selected via runtime settings (DB) or `IMAGE_PROVIDER` env var fallback (azure/placeholder)
- Images saved to `data/images/`, served via `/api/images/[id]`
- Azure image provider (`name: 'azure-image'`) does not send `response_format` (newer models like gpt-image-1.5 reject it); handles both `b64_json` and `url` responses
- Each image stores `model` and `generationTimeMs` in `imageCache` for provenance tracking
- Async: recipes appear immediately with "Generating image" spinner placeholders; a plain JS polling script (in `suggest.ts`) fetches `/partials/image-slot` every 3s per recipe and swaps in the `<img>` via `outerHTML` when ready

### Caching
- SHA-256 hash of normalized ingredients + language + dietary filters + provider + model (`src/lib/cache.ts`)
- Cache stored in `recipe_cache` table; same ingredient combo with same provider/model returns cached recipes without AI call

### Database
- SQLite at `data/kochgeist.db` via Drizzle ORM + better-sqlite3
- Schema in `src/db/schema.ts`: `users`, `sessions`, `invitations`, `passwordResets`, `emailVerifications`, `recipes`, `recipeCache`, `bookmarks`, `searchHistory`, `imageCache`, `settings`
- Migrations in `src/db/migrations/`
- JSON arrays stored as TEXT columns (ingredients, instructions, dietary tags, default filters)
- `settings` table stores runtime key-value config (e.g. `ai_provider`, `ai_model`, `image_provider`, `image_model`); managed via `src/lib/settings.ts`

### i18n
- `src/lib/i18n/index.ts` — `t(key, locale)` function with dot-notation keys, `detectLocale()` for request-based detection
- Locale files: `src/lib/i18n/locales/{en,de,fr,it,es,pt}.json`
- Language switcher is a dropdown in the header (`src/components/shared/LanguageSwitcher.astro`)
- German uses casual "du" form; all languages use proper native characters (e.g. German umlauts ä/ö/ü/ß, not digraphs)
- AI prompts explicitly instruct models to use proper native characters per language

### Filters
- 16 dietary/lifestyle filters defined in `DietaryFilters.astro` (home) and `FilterPills.astro` (bookmarks)
- Categories: Diet (vegetarian, vegan, gluten-free, dairy-free, low-carb, high-protein, low-cholesterol), Time & Budget (quick, elaborate, budget, gourmet), Occasion (kid-friendly, date-night, comfort, one-pot, meal-prep)
- Filter IDs are stored in `dietaryTags` JSON column on recipes; bookmark filtering matches against these
- Each filter has a Material Symbols icon and is translated in all 6 locales
- Ingredient input supports comma-separated entry and auto-capitalizes the first letter

### Styling
- Tailwind CSS v4 with CSS-first `@theme` config in `src/assets/css/global.css`
- Design tokens use Material Design 3 color naming (primary, surface, tertiary, etc.)
- Fonts: Plus Jakarta Sans (headlines), Inter (body/labels)
- Icons: Material Symbols Outlined (loaded via CDN)
- Custom utilities: `.editorial-gradient`, `.glass-header`, `.recipe-card-shadow`

### Component organization
Components in `src/components/` are grouped by page context:
- `home/` — ingredient input, filters, search
- `recipes/` — bento grid cards (featured, vertical, horizontal)
- `detail/` — recipe modal content (interactive ingredient checkboxes, dietary tag pills, AI provenance metadata)
- `bookmarks/` — saved recipes grid
- `layout/` — header, bottom nav, base layout
- `shared/` — language switcher, loading spinner, error toast

## Environment

Copy `.env.example` to `.env`. Key vars:
- `AI_PROVIDER` — text AI provider (azure/openai/anthropic/ollama/lmstudio)
- `IMAGE_PROVIDER` — image generation provider (azure/placeholder)
- Provider-specific keys: `AZURE_ENDPOINT`, `AZURE_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — SMTP config for auth emails (falls back to console logging if not set)
- `APP_URL` — base URL for email links (default: `http://localhost:4321`)

## Design reference

`stitch/` contains the original HTML design templates used as the visual reference for the app.
