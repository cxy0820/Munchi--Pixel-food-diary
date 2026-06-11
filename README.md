# Munchi

Munchi is a React/Vite Web/PWA for turning food and drink photos into warm 16-bit pixel stickers, saving them into a daily journal, reviewing them in a calendar, collecting them in a Pixel Dex, and arranging shareable collage boards.

The product is English-only and uses a Dusty Rose accent instead of orange.

The landing page lives at `/`. The working app lives under `/app/today`.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` from `.env.example` and add your API keys:

   ```bash
   BACKGROUND_PROVIDER=removebg
   REMOVE_BG_API_KEY=your_remove_bg_api_key_here
   CLIPDROP_API_KEY=your_clipdrop_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-5.5
   OPENAI_IMAGE_MODEL=gpt-image-1
   PORT=5173
   ```

3. Start the app and API proxy:

   ```bash
   npm run dev
   ```

4. Open `http://127.0.0.1:5173`.

For phone testing, keep the terminal open and open `http://YOUR-COMPUTER-IP:5173` on a phone connected to the same Wi-Fi.

## Scripts

- `npm run dev`: builds the app, then starts the app and API server on `0.0.0.0:5173`.
- `npm run dev:server`: starts only the app and API server.
- `npm run build`: type-checks and builds the production app.

## Data

- Records, sticker images, and collages are stored in browser IndexedDB.
- Settings are stored in localStorage.
- Settings includes JSON export/import for local backup and restore.

## AI Pipeline

The frontend never receives API keys.

- `/api/remove-background` sends the image to remove.bg by default and returns a transparent cutout. Set `BACKGROUND_PROVIDER=clipdrop` to use Clipdrop instead.
- `/api/analyze-food` sends the image to OpenAI vision and returns name, category, confidence, and a short note.
- `/api/pixel-sticker` sends the transparent cutout to OpenAI Images and returns a warm 16-bit pixel item icon.
- The Add flow runs cutout, food naming, and pixel sticker generation. A pixel sticker is required before saving.

The proxy validates image type, checks basic file magic bytes, limits uploads to 8 MB, uses a CSRF token, rate-limits AI requests, and returns English error messages for missing key, invalid key, quota, rate-limit, and network failures.
