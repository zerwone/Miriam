# Miriam Lab - Setup Guide

## Quick Start

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file in the root directory:
   ```bash
   cp .env.example .env.local
   ```
   
   Then edit `.env.local` and add your OpenRouter API key:
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   OPENROUTER_HTTP_REFERER=https://miriam-lab.com
   OPENROUTER_X_TITLE=Miriam Lab
   ```

3. **Get an OpenRouter API key**:
   - Sign up at https://openrouter.ai
   - Get your API key from the dashboard
   - **Important**: Purchase at least $10 in credits to unlock 1000 free requests/day (instead of 50)

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
/app
  /(app)              # Route group for app section (routes at /app/*)
    layout.tsx         # App navigation layout
    page.tsx           # Miriam Chat (at /app)
    /compare           # Compare Mode (at /app/compare)
    /judge             # Judge Mode (at /app/judge) - Coming soon
    /research          # Research Panel (at /app/research) - Coming soon
  /api
    /miriam            # Single-model chat API
    /compare           # Multi-model comparison API
  layout.tsx           # Root layout
  page.tsx             # Landing page (at /)
/lib
  openrouter.ts       # OpenRouter API client utility
  types.ts            # Shared TypeScript types
```

## Features Implemented (Phase A)

✅ **Miriam Chat**
- Single-model chat interface
- Model selection dropdown
- Message history
- Loading states

✅ **Compare Mode**
- Side-by-side comparison of up to 5 models
- System prompt support
- Token usage and timing metrics
- Error handling

✅ **OpenRouter Integration**
- Centralized API client
- Error handling and rate limit detection
- Token usage tracking

## Next Steps (Phase B+)

- User authentication (Supabase)
- Credit system and wallet
- Judge mode implementation
- Research panel implementation
- Billing integration (Stripe)

## Troubleshooting

### "OPENROUTER_API_KEY is not set"
- Make sure you've created `.env.local` with your API key
- Restart the dev server after adding environment variables

### Rate limit errors
- Free models are rate-limited to 50 requests/day (or 1000 if you've purchased ≥$10)
- Consider using paid models for testing, or wait for the rate limit to reset

### Build errors
- Run `npm install` to ensure all dependencies are installed
- Check that TypeScript types are correct: `npx tsc --noEmit`
