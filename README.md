# Miriam Lab

An AI playground where users can chat with AI models, compare multiple models side-by-side, use Judge mode to rank responses, and leverage a Research Panel for collaborative analysis.

## Features

### Phase A (Current)
- ✅ **Miriam Chat**: Single-model chat interface
- ✅ **Compare Mode**: Side-by-side comparison of up to 5 models
- ✅ OpenRouter integration with error handling

### Coming Soon
- **Judge Mode**: AI judge ranks and critiques model responses
- **Research Panel**: Multiple expert models + synthesizer
- **Credit System**: Hybrid subscription + usage-based pricing
- **User Accounts**: Supabase authentication and wallet management
- **Billing**: Stripe integration for subscriptions and top-ups

## Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router) + React + TypeScript
- **Styling**: Tailwind CSS
- **LLM Provider**: OpenRouter
- **Database/Auth**: Supabase (to be configured in Phase B)
- **Billing**: Stripe (to be configured in Phase D)

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` and add your OpenRouter API key:
   ```
   OPENROUTER_API_KEY=your_key_here
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
/app
  /api
    /miriam        # Single-model chat endpoint
    /compare       # Multi-model comparison endpoint
  /app
    page.tsx       # Miriam Chat UI
    /compare       # Compare Mode UI
    /judge         # Judge Mode UI (coming soon)
    /research      # Research Panel UI (coming soon)
/lib
  openrouter.ts   # OpenRouter API client
  types.ts        # Shared TypeScript types
```

## Development Phases

- **Phase A** (Weeks 1-2): Foundation - Miriam Chat + Compare ✅
- **Phase B** (Weeks 3-4): Accounts & Wallet
- **Phase C** (Weeks 5-7): Advanced modes (Judge + Research)
- **Phase D** (Weeks 8-9): Billing & Plans
- **Phase E** (Weeks 10-11): Observability & Analytics
- **Phase F** (Weeks 12+): Growth features

## Credits System (Planned)

- **Miriam chat**: 1 credit per message
- **Compare (3 models)**: 3 credits
- **Compare (5 models)**: 5 credits
- **Judge mode**: 6 credits
- **Research panel**: 10 credits

## License

MIT
