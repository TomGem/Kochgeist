# User Guide

## First-Time Setup

When Kochgeist starts with an empty database, the first visitor is directed to a registration page to create the admin account. No invitation code is needed for this first user.

After the admin account is created, all subsequent users need an invitation code to register.

## Registration

1. Go to `/register`
2. Enter your name, email, password, and invitation code
3. Check your email for a 6-digit verification code
4. Enter the code on the verification page

If SMTP is not configured, the verification code is logged to the server console.

## Searching for Recipes

1. **Enter ingredients** -- type ingredients into the input field. Separate multiple ingredients with commas (e.g. "chicken, rice, garlic"). Tags are auto-capitalized.
2. **Apply filters** (optional) -- tap any of the 22 dietary/lifestyle/course filters to narrow your results:
   - **Diet**: Vegetarian, Vegan, Gluten-Free, Dairy-Free, Low-Carb, High-Protein, Low-Cholesterol
   - **Time & Budget**: Quick, Elaborate, Budget, Gourmet
   - **Occasion**: Kid-Friendly, Date Night, Comfort Food, One-Pot, Meal Prep
   - **Course**: Amuse-Bouche, Starter, Salad, Soup, Main Course, Dessert
   - Use the **Clear Filters** button to remove all active filters at once
3. **Submit** -- the AI generates 4 recipe suggestions displayed in a bento grid layout
4. **Images** -- recipe images generate in the background. You'll see a spinner that automatically updates when the image is ready.

### Surprise Me

Click the suggest button without entering any ingredients to get random recipe inspiration. A confirmation modal will appear -- confirm to let the AI surprise you.

### Favourite Shortcuts

Below the filters, up to 4 user-configured shortcut tiles offer one-tap recipe searches. Each shortcut stores a name, icon, preset filters, and preset ingredients. Clicking a tile auto-fills the ingredient input and selects the saved filters. Configure shortcuts in `/settings`.

### Ingredient Scanner

Tap the camera button in the bottom navigation to open the ingredient scanner. Take a photo of your ingredients and the AI will recognize them automatically, populating the ingredient input.

### Caching

If you search the same ingredient combination (with the same language and filters), cached results are returned instantly without an AI call.

## Viewing a Recipe

Tap any recipe card to open the detail modal with:

- Full ingredient list with interactive checkboxes (tap to mark as done) and a servings adjuster that dynamically scales ingredient amounts
- Step-by-step instructions
- Dietary tags and contextual badge (Pantry Perfect, Quick & Easy, Chef's Challenge, or Homemade)
- AI-generated food photo
- AI provenance info (provider, model, generation time)
- An AI-generated "Chef's Secret" cooking tip

### Shopping List

In the recipe detail, adjust servings with the +/- buttons to scale ingredient amounts. Tap ingredients to check them off. Use the export button to share unchecked ingredients (using scaled quantities) via the system share sheet (or clipboard on unsupported browsers).

### Cooking Mode

Tap the cooking mode button in the recipe detail to enter a fullscreen step-by-step walkthrough:

- Navigate steps with arrow keys, swipe, or on-screen buttons
- Timers are auto-detected from step text (e.g. "bake for 20 minutes")
- Start, pause, and reset timers with audio alarm and vibration on completion
- Progress bar and circular indicators show your position

### Recipe Sharing

Share a recipe via its permanent link at `/recipe/[id]`. The link is accessible to any authenticated user.

## Bookmarks

- **Save**: Tap the bookmark icon on any recipe card or in the detail modal
- **View**: Go to the Bookmarks page from the bottom navigation
- **Filter**: Use filter pills on the bookmarks page to narrow saved recipes by dietary tags
- **Remove**: Tap the bookmark icon again to unsave

Bookmarks are personal -- each user has their own saved recipes.

## Search History

Past searches are saved and accessible from the home page. Tap a previous search to re-run it. History is personal to each user.

## Language

Use the language dropdown in the header to switch between:

- English
- German (Deutsch)
- French (Fran&ccedil;ais)
- Italian (Italiano)
- Spanish (Espa&ntilde;ol)
- Portuguese (Portugu&ecirc;s)

The language setting affects the UI, recipe output, and AI prompts.

## Admin Panel

Admins can access the admin panel at `/admin` to:

### Manage Invitation Codes

- Generate new codes with a configurable expiry date and maximum number of uses
- Codes use a readable format (`ABCD-1234`)
- View active, expired, and used-up codes

### Manage Users

- View all registered users
- Promote users to admin or demote admins
- Manually verify unverified users

### Configure AI & Image Providers

- Select the text AI provider and model (Azure, OpenAI, Anthropic, Ollama, LM Studio)
- Select the image generation provider and model (Azure, Placeholder)
- Changes take effect immediately without restarting the server

## User Settings

Go to `/settings` to configure:

- **Language preference** -- persisted per user
- **Favourite Shortcuts** -- configure up to 4 preset tiles with custom name, icon, ingredients, and filters
- **Change password** -- update your account password

## Password Reset

1. Go to `/forgot-password`
2. Enter your email address
3. Check your email for a reset link
4. Follow the link to set a new password
