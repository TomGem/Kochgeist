# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Kochgeist — AI-powered recipe suggestion app. Users enter ingredients, an AI suggests 4 recipes with generated images. Multilingual (EN/DE/FR/IT/ES/PT).

## Commands

All commands run from the project root:

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
1. Middleware (`src/middleware/index.ts`) runs four middleware in sequence: security headers, CSRF protection (validates origin for non-safe methods, supports `X-Forwarded-Proto`/`X-Forwarded-Host` for reverse proxies), auth (validates session cookie, sets `context.locals.user`/`context.locals.session`, enforces route protection), then language detection (sets `context.locals.lang`). Astro's built-in origin check is disabled in `astro.config.mjs` (`security: { checkOrigin: false }`) in favour of custom CSRF middleware.
2. If no users exist in DB, middleware redirects all routes to `/register?setup=true` (first-user bootstrap)
3. Pages render Astro components; interactive parts use htmx (`hx-get`, `hx-post`, `hx-swap`) targeting partials
4. API routes in `src/pages/api/` handle recipe suggestion, bookmarks, history, image generation, auth, and admin operations
5. htmx partials in `src/pages/partials/` return HTML fragments (recipe detail, bookmark grid, image slots)
6. Recipe detail modal is opened via Alpine `x-init="$store.ui.modalOpen = true"` inside the partial itself (not via afterSwap events)

### Scanner
- Standalone page at `/scanner` with camera access (`capture="environment"`) for ingredient recognition
- Uploads photo to `/api/ingredients/recognize` which uses the AI provider's `recognizeIngredients()` method
- Component: `src/components/home/CameraButton.astro`; accessible from bottom navigation

### Cooking mode
- Step-by-step fullscreen modal (`src/components/detail/CookingMode.astro`) launched from recipe detail
- Auto-detects timers from step text via regex across all 6 languages
- Timer controls (start/pause/reset) with audio alarm + vibration on completion
- Keyboard navigation (arrow keys, escape) and touch-optimized UI
- Progress visualization with progress bar and circular indicators

### Surprise Me & Favourite Shortcuts
- "Surprise Me" mode: if the user clicks suggest without entering ingredients, a confirmation modal appears; confirming sends `surpriseMe: 'true'` to `/api/recipes/suggest`, which generates random recipes without ingredient input
- Favourite Shortcuts (`src/components/home/FavouriteShortcuts.astro`): 1–4 user-configured tiles below DietaryFilters on home page; each stores a name, icon, preset filters, and preset ingredients; clicking a tile auto-fills ingredients and selects filters via `$store.shortcuts.apply(index)`
- Configured in `/settings` with an inline card editor (add/edit/delete); stored as JSON array on `users.favouriteShortcuts` (SQLite column `default_filters`)

### Shopping list & ingredient interaction
- Interactive ingredient checkboxes in recipe detail — click to mark as done (green checkmark)
- Servings adjuster (Alpine.js) scales ingredient amounts dynamically; export uses scaled quantities
- Export button filters unchecked ingredients and shares via `navigator.share()` (Web Share API); falls back to clipboard copy

### Badges & cooking tips
- `src/lib/badges.ts` — `computeDetailBadge()` generates contextual badges based on recipe metadata (Pantry Perfect, Quick & Easy, Chef's Challenge, Homemade)
- AI generates a contextual cooking tip per ingredient search, stored as `tip` JSON column in `recipe_cache`; displayed as "Chef's Secret" in results

### Authentication & multi-user
- Cookie-based sessions stored in SQLite (`sessions` table), 30-day expiry
- `src/lib/auth/` — password hashing (bcryptjs), session CRUD, email sending (nodemailer), token generation, first-user detection
- Registration requires an invitation code (entered on `/register` form) except for the first user (`/register?setup=true` — becomes admin)
- Invitation codes are short, readable format (`ABCD-1234`), generated in admin panel with configurable expiry date and max uses
- Email verification via 6-digit code after registration
- Password reset via email token link
- Route protection in middleware: only auth pages (`/login`, `/register`, `/forgot-password`, `/reset-password`) are public; all other routes require authentication; admin routes (`/admin`, `/api/admin/*`) require admin role
- Bookmarks and search history are user-scoped (`userId` column); recipe cache and recipes are shared across all users
- Admin panel at `/admin`: generate invitation codes (with expiry date picker and max uses), manage users (promote/demote, verify), configure AI/image providers and models at runtime
- Auth pages: `/login`, `/register`, `/register/verify`, `/forgot-password`, `/reset-password`
- User settings at `/settings`: language preference, favourite shortcuts (1–4 presets with filters + ingredients)
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

### Recipe cards (bento grid)
- Recipe cards are generated as inline HTML strings in `src/pages/api/recipes/suggest.ts` via `renderResultsPartial()` — there are no separate card components
- Layout: 1 Featured (8-col), 1 Vertical (4-col), 2 Horizontal (6-col each) on md+ screens
- Selection algorithm picks the best-match recipe (lowest extra ingredient ratio) as featured

### Recipe sharing
- `src/lib/share.ts` — `getShareUrl()` builds shareable recipe URLs
- `/recipe/[id]` page renders a standalone recipe view for shared links

### Rate limiting
- `src/lib/rate-limit.ts` — in-memory rate limiter (`isRateLimited`, `clearRateLimit`) with periodic cleanup of expired entries

### Caching
- SHA-256 hash of normalized ingredients + language + dietary filters + provider + model (`src/lib/cache.ts`)
- Cache stored in `recipe_cache` table; same ingredient combo with same provider/model returns cached recipes without AI call

### Database
- SQLite at `data/kochgeist.db` via Drizzle ORM + better-sqlite3
- Schema in `src/db/schema.ts`: `users`, `sessions`, `invitations`, `passwordResets`, `emailVerifications`, `recipes`, `recipeCache`, `bookmarks`, `searchHistory`, `imageCache`, `settings`
- Migrations in `src/db/migrations/`
- JSON arrays stored as TEXT columns (ingredients, instructions, dietary tags, favourite shortcuts)
- `recipeCache.tip` stores AI-generated cooking tip as JSON TEXT
- `settings` table stores runtime key-value config (e.g. `ai_provider`, `ai_model`, `image_provider`, `image_model`); managed via `src/lib/settings.ts`

### i18n
- `src/lib/i18n/index.ts` — `t(key, locale)` function with dot-notation keys, `detectLocale()` for request-based detection
- Locale files: `src/lib/i18n/locales/{en,de,fr,it,es,pt}.json`
- Language switcher is a dropdown in the header (`src/components/shared/LanguageSwitcher.astro`)
- German uses casual "du" form; all languages use proper native characters (e.g. German umlauts ä/ö/ü/ß, not digraphs)
- AI prompts explicitly instruct models to use proper native characters per language

### Filters
- 22 dietary/lifestyle/course filters defined in `DietaryFilters.astro` (home) and `FilterPills.astro` (bookmarks)
- Categories: Diet (vegetarian, vegan, gluten-free, dairy-free, low-carb, high-protein, low-cholesterol), Time & Budget (quick, elaborate, budget, gourmet), Occasion (kid-friendly, date-night, comfort, one-pot, meal-prep), Course (amuse-bouche, starter, salad, soup, main-course, dessert)
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
- `home/` — HeroSearch, IngredientTags, DietaryFilters, FavouriteShortcuts, SuggestButton, CameraButton
- `detail/` — RecipeModal, CookingMode
- `bookmarks/` — BookmarkCard, FilterPills, EmptyState
- `layout/` — Header, BottomNav, BaseLayout
- `shared/` — LanguageSwitcher, LoadingSpinner, ErrorToast

## Environment

Copy `.env.example` to `.env`. Key vars:
- `AI_PROVIDER` — text AI provider (azure/openai/anthropic/ollama/lmstudio)
- `IMAGE_PROVIDER` — image generation provider (azure/placeholder)
- Provider-specific keys: `AZURE_ENDPOINT`, `AZURE_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — SMTP config for auth emails (falls back to console logging if not set)
- `APP_URL` — base URL for email links (default: `http://localhost:4321`)

### Deployment
- `Dockerfile` — multi-stage build (Node 22 alpine); runtime exposes port 4321, persists data via `/app/data` volume
- `docker-compose.yml` — mounts `.env` and a named volume for `data/`
- `.github/workflows/docker-publish.yml` — builds and pushes to GitHub Container Registry (ghcr.io) on release; tags with version + `latest`

## Design reference

`stitch/` contains the original HTML design templates used as the visual reference for the app.
