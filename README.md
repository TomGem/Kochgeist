# Kochgeist

AI-powered recipe suggestion app. Enter the ingredients you have on hand and Kochgeist will suggest 4 recipes with AI-generated images. Available in English, German, French, Italian, Spanish, and Portuguese.

## Features

- **Ingredient-based recipe suggestions** -- type or photograph ingredients, get 4 curated recipes
- **AI image generation** -- each recipe gets a food-photography-style image generated in the background
- **Surprise Me** -- get random recipe inspiration without entering any ingredients
- **Favourite Shortcuts** -- user-configured preset tiles with custom ingredients and filters for one-tap recipe searches
- **Ingredient scanner** -- photograph ingredients with your camera for automatic recognition
- **Cooking mode** -- step-by-step fullscreen walkthrough with auto-detected timers, audio alarms, and keyboard/touch navigation
- **Shopping list** -- interactive ingredient checkboxes with servings adjuster and export via Web Share API or clipboard
- **Recipe sharing** -- share recipes to the community feed with a copy-to-clipboard link at `/recipe/[id]`
- **Badges & cooking tips** -- contextual badges (Pantry Perfect, Quick & Easy, etc.) and AI-generated "Chef's Secret" tips
- **Bookmarks** -- save recipes for later
- **Search history** -- revisit past ingredient searches
- **Dietary & lifestyle filters** -- 22 filters across diet (vegetarian, vegan, gluten-free, dairy-free, low-carb, high-protein, low-cholesterol), time & budget (quick, elaborate, budget, gourmet), occasion (kid-friendly, date night, comfort food, one-pot, meal prep), and course (amuse-bouche, starter, salad, soup, main course, dessert) with a clear-all button
- **Comma-separated input** -- enter multiple ingredients at once separated by commas; tags are auto-capitalized
- **Multilingual** -- English, German, French, Italian, Spanish, and Portuguese with a dropdown language switcher
- **Multi-provider AI** -- supports Azure AI, OpenAI, Anthropic, Ollama, and LM Studio
- **Multi-user with auth** -- cookie-based sessions, invitation codes, email verification, password reset
- **Admin panel** -- manage users, generate invitation codes, configure AI/image providers and models at runtime

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Astro](https://astro.build/) v6 (SSR, Node adapter) |
| Interactivity | [htmx](https://htmx.org/) + [Alpine.js](https://alpinejs.dev/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) v4 (CSS-first config) |
| Database | SQLite via [Drizzle ORM](https://orm.drizzle.team/) + better-sqlite3 |
| AI (text) | Azure AI Foundry (default), OpenAI, Anthropic, Ollama, LM Studio |
| AI (images) | Azure AI (gpt-image-1) or placeholder |

## Getting Started

### Prerequisites

- Node.js >= 22.12.0

### Setup

```sh
npm install
cp .env.example .env   # then fill in your API keys
npm run db:push         # create the SQLite database
npm run dev             # start dev server at localhost:4321
```

The first user to register becomes the admin. Subsequent users need an invitation code generated from the admin panel.

### Docker

```sh
cp .env.example .env    # configure your API keys and SMTP
docker compose up -d --build
```

The app will be available at `http://localhost:4321`. SQLite database and generated images are persisted in a Docker volume.

See [docs/deployment.md](docs/deployment.md) for detailed deployment instructions.

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `AI_PROVIDER` | Text AI provider: `azure` (default), `openai`, `anthropic`, `ollama`, `lmstudio` |
| `IMAGE_PROVIDER` | Image provider: `azure` (default), `placeholder` |
| `AZURE_ENDPOINT` | Azure OpenAI endpoint URL |
| `AZURE_API_KEY` | Azure OpenAI API key |
| `AZURE_DEPLOYMENT` | Azure model deployment name (e.g. `gpt-4o`) |
| `AZURE_IMAGE_DEPLOYMENT` | Azure image model (e.g. `gpt-image-1`) |
| `OPENAI_API_KEY` | OpenAI API key (if using OpenAI provider) |
| `ANTHROPIC_API_KEY` | Anthropic API key (if using Anthropic provider) |
| `OLLAMA_BASE_URL` | Ollama server URL (default `http://localhost:11434`) |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP server port (default `587`) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | Sender email address |
| `APP_URL` | Base URL for email links (default `http://localhost:4321`) |

## Commands

```sh
npm run dev          # Dev server at localhost:4321
npm run build        # Production build to dist/
npm run preview      # Preview production build
npm run db:generate  # Generate Drizzle migrations from schema
npm run db:push      # Push schema changes to SQLite DB
```

## Project Structure

```
src/
  components/       # Astro components grouped by page context
    home/           #   ingredient input, filters, favourite shortcuts, camera button
    detail/         #   recipe modal, cooking mode
    bookmarks/      #   saved recipes grid, filter pills
    layout/         #   header, bottom nav, base layout
    shared/         #   language switcher, spinner, error toast
  pages/
    api/            # API routes (suggest, bookmarks, history, images, auth, admin)
    partials/       # htmx HTML fragments (recipe detail, image slots)
  lib/
    ai/             # AI provider system (interface, registry, providers, prompts)
    auth/           # Authentication (sessions, passwords, email, invitations)
    images/         # Image generation provider system
    i18n/           # Translations (en, de, fr, it, es, pt)
    cache.ts        # Ingredient hash for recipe caching
    badges.ts       # Contextual recipe badges
    rate-limit.ts   # In-memory rate limiter
    settings.ts     # Runtime key-value settings (DB-backed)
  db/
    schema.ts       # Drizzle schema (users, sessions, recipes, bookmarks, cache, etc.)
    migrations/     # SQL migrations
  assets/css/       # Tailwind theme config (Material Design 3 tokens)
data/               # SQLite DB + generated images (gitignored)
docs/               # Documentation (architecture, deployment, user guide)
stitch/             # Original HTML design templates (visual reference)
```

## Documentation

- [Architecture](docs/architecture.md) -- system design and technical details
- [Deployment](docs/deployment.md) -- Docker and manual deployment instructions
- [User Guide](docs/user-guide.md) -- how to use the app

## License

[MIT](LICENSE)
