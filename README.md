# Kochgeist

AI-powered recipe suggestion app. Enter the ingredients you have on hand and Kochgeist will suggest 4 recipes with AI-generated images. Available in English, German, French, Italian, Spanish, and Portuguese.

## Features

- **Ingredient-based recipe suggestions** -- type or photograph ingredients, get 4 curated recipes
- **AI image generation** -- each recipe gets a food-photography-style image generated in the background
- **Quick Start presets** -- one-tap ingredient combos (Leafy Greens, 15-Min Meals) for instant inspiration
- **Bookmarks** -- save recipes for later
- **Search history** -- revisit past ingredient searches
- **Dietary & lifestyle filters** -- 16 filters across diet (vegetarian, vegan, gluten-free, dairy-free, low-carb, high-protein, low-cholesterol), time & budget (quick, elaborate, budget, gourmet), and occasion (kid-friendly, date night, comfort food, one-pot, meal prep). Filters apply to both recipe suggestions and saved bookmarks.
- **Comma-separated input** -- enter multiple ingredients at once separated by commas; tags are auto-capitalized
- **Multilingual** -- English, German, French, Italian, Spanish, and Portuguese with a dropdown language switcher
- **Multi-provider AI** -- supports Azure AI, OpenAI, Anthropic, Ollama, and LM Studio

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
cd kochgeist
npm install
cp .env.example .env   # then fill in your API keys
npm run db:push         # create the SQLite database
npm run dev             # start dev server at localhost:4321
```

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

## Commands

All commands run from the `kochgeist/` directory:

```sh
npm run dev          # Dev server at localhost:4321
npm run build        # Production build to dist/
npm run preview      # Preview production build
npm run db:generate  # Generate Drizzle migrations from schema
npm run db:push      # Push schema changes to SQLite DB
```

## Project Structure

```
kochgeist/
  src/
    components/       # Astro components grouped by page context
      home/           #   ingredient input, filters, quick start
      recipes/        #   bento grid cards (featured, vertical, horizontal)
      detail/         #   recipe modal
      bookmarks/      #   saved recipes grid
      layout/         #   header, bottom nav, base layout
      shared/         #   language switcher, spinner, error toast
    pages/
      api/            # API routes (suggest, bookmarks, history, images)
      partials/       # htmx HTML fragments (recipe detail, image slots)
    lib/
      ai/             # AI provider system (interface, registry, providers, prompts)
      images/         # Image generation provider system
      i18n/           # Translations (en, de, fr, it, es, pt)
      cache.ts        # Ingredient hash for recipe caching
    db/
      schema.ts       # Drizzle schema (recipes, bookmarks, cache, history)
      migrations/     # SQL migrations
    assets/css/       # Tailwind theme config (Material Design 3 tokens)
  data/               # SQLite DB + generated images (gitignored)
  stitch/             # Original HTML design templates (visual reference)
```
