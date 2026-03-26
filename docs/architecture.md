# Architecture

## Overview

Kochgeist is a server-side rendered (SSR) web application built with [Astro](https://astro.build/) using the Node.js adapter. There is no SPA framework -- interactivity is handled by [htmx](https://htmx.org/) for server communication and [Alpine.js](https://alpinejs.dev/) for client-side state.

## Request Flow

```
Browser
  |
  v
Astro Middleware (src/middleware/index.ts)
  |- Security headers  -> sets CSP, HSTS, etc.
  |- CSRF protection   -> validates origin for non-safe methods
  |- Language detection -> sets context.locals.lang
  |- Auth validation    -> validates session cookie, sets context.locals.user
  |
  v
Route Handler
  |- Page routes   -> render Astro components (full HTML)
  |- API routes    -> return JSON (src/pages/api/)
  |- Partial routes -> return HTML fragments for htmx (src/pages/partials/)
```

1. **Middleware** runs four handlers in sequence: security headers, CSRF protection (validates origin for non-safe methods), language detection (sets `context.locals.lang` from cookie/header), and auth (validates session cookie, sets user context, enforces route protection).
2. If no users exist in the database, all routes redirect to `/register?setup=true` for first-user bootstrap.
3. **Page routes** render full Astro components. Interactive sections use htmx attributes (`hx-get`, `hx-post`, `hx-swap`) targeting partial endpoints.
4. **API routes** (`src/pages/api/`) handle recipe suggestions, bookmarks, history, image serving, auth, and admin operations.
5. **Partial routes** (`src/pages/partials/`) return HTML fragments that htmx swaps into the page (recipe detail modal, bookmark grid, image slots).
6. The recipe detail modal is opened via Alpine.js: `x-init="$store.ui.modalOpen = true"` inside the partial itself.

## Authentication

Cookie-based sessions stored in SQLite with 30-day expiry.

- **Registration**: Requires an invitation code except for the first user (who becomes admin)
- **Email verification**: 6-digit code sent after registration
- **Password reset**: Token-based link sent via email
- **Route protection**: Only auth pages are public; all other routes require authentication; admin routes require admin role
- **Invitation codes**: Short readable format (`ABCD-1234`) with configurable expiry and max uses

Libraries: bcrypt (password hashing), nodemailer (emails), nanoid (token generation).

## AI Provider System

A pluggable provider architecture supports multiple AI backends for text and image generation.

### Text Generation

```
AI_PROVIDER env var
  |
  v
Registry (src/lib/ai/registry.ts) -- lazy-loads provider
  |
  v
Provider implementation (src/lib/ai/providers/)
  |- azure.ts     -- Azure AI Foundry
  |- openai.ts    -- OpenAI API
  |- anthropic.ts -- Anthropic API
  |- ollama.ts    -- Ollama (local)
  |- lmstudio.ts  -- LM Studio (local)
```

- `AIProvider` interface (`src/lib/ai/provider.ts`): `generateRecipes()`, `recognizeIngredients()`, and `listModels()`
- Provider selected via runtime settings (DB) or `AI_PROVIDER` env var fallback; cache is cleared when settings change
- Shared prompt templates and Zod schema for structured output in `src/lib/ai/prompts/`
- Response parsing is lenient: handles wrapped arrays, single objects, or direct arrays

### Image Generation

```
IMAGE_PROVIDER env var
  |
  v
Provider (src/lib/images/provider.ts)
  |- azure.ts       -- Azure AI (gpt-image-1)
  |- placeholder.ts  -- Colored placeholder images
```

- Images saved to `data/images/`, served via `/api/images/[id]`
- Async generation: recipes appear immediately with spinner placeholders; a polling script checks `/partials/image-slot` every 3 seconds per recipe

## Caching

Recipe results are cached to avoid redundant AI calls:

1. Ingredients are normalized, sorted, and combined with the language code and dietary filters
2. A SHA-256 hash is computed (`src/lib/cache.ts`)
3. The hash is checked against the `recipe_cache` table
4. Cache hit: return stored recipes. Cache miss: call AI provider, store result

## Database

SQLite via Drizzle ORM + better-sqlite3. Database file at `data/kochgeist.db`.

### Schema (`src/db/schema.ts`)

| Table | Purpose |
|-------|---------|
| `users` | User accounts (email, name, hashed password, role, verified status) |
| `sessions` | Active sessions (token, userId, expiry) |
| `invitations` | Invitation codes (code, maxUses, usedCount, expiresAt) |
| `passwordResets` | Password reset tokens |
| `emailVerifications` | Email verification codes |
| `recipes` | All generated recipes (shared across users) |
| `recipeCache` | Ingredient hash -> recipe mapping |
| `bookmarks` | User-scoped saved recipes |
| `searchHistory` | User-scoped search history |
| `imageCache` | Image generation tracking |
| `settings` | Runtime key-value config (AI/image provider, model, etc.) |

JSON arrays (ingredients, instructions, dietary tags) are stored as TEXT columns. The `settings` table is managed via `src/lib/settings.ts` and allows runtime configuration of providers and models from the admin panel.

## Internationalization

- `t(key, locale)` function with dot-notation keys (`src/lib/i18n/index.ts`)
- Locale detection from cookie or `Accept-Language` header
- Locale files: `src/lib/i18n/locales/{en,de,fr,it,es,pt}.json`
- AI prompts include explicit instructions to use proper native characters per language

## Styling

- Tailwind CSS v4 with CSS-first `@theme` configuration (`src/assets/css/global.css`)
- Design tokens follow Material Design 3 color naming (primary, surface, tertiary, etc.)
- Fonts: Plus Jakarta Sans (headlines), Inter (body)
- Icons: Material Symbols Outlined (Google CDN)

## Component Organization

Components in `src/components/` are grouped by page context:

| Directory | Contents |
|-----------|----------|
| `home/` | HeroSearch, IngredientTags, DietaryFilters, SuggestButton, QuickStart, CameraButton |
| `detail/` | RecipeModal, CookingMode |
| `bookmarks/` | BookmarkCard, FilterPills, EmptyState |
| `layout/` | Header, BottomNav, BaseLayout |
| `shared/` | LanguageSwitcher, LoadingSpinner, ErrorToast |

Note: Recipe bento grid cards (featured, vertical, horizontal layouts) are generated as inline HTML in `src/pages/api/recipes/suggest.ts` via `renderResultsPartial()`, not as separate components.
