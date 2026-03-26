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
2. **Apply filters** (optional) -- tap any of the 16 dietary/lifestyle filters to narrow your results:
   - **Diet**: Vegetarian, Vegan, Gluten-Free, Dairy-Free, Low-Carb, High-Protein, Low-Cholesterol
   - **Time & Budget**: Quick, Elaborate, Budget, Gourmet
   - **Occasion**: Kid-Friendly, Date Night, Comfort Food, One-Pot, Meal Prep
3. **Submit** -- the AI generates 4 recipe suggestions displayed in a bento grid layout
4. **Images** -- recipe images generate in the background. You'll see a spinner that automatically updates when the image is ready.

### Quick Start Presets

Below the ingredient input, preset buttons offer common ingredient combos for quick inspiration.

### Caching

If you search the same ingredient combination (with the same language and filters), cached results are returned instantly without an AI call.

## Viewing a Recipe

Tap any recipe card to open the detail modal with:

- Full ingredient list with quantities
- Step-by-step instructions
- Dietary tags
- AI-generated food photo

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

## Password Reset

1. Go to `/forgot-password`
2. Enter your email address
3. Check your email for a reset link
4. Follow the link to set a new password
