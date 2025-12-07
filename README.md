# Miriam Lab

**One prompt. Many minds.**

Miriam Lab is a multi-model AI playground where you can chat, compare, judge, and research with multiple AI models side-by-side.

## Features

- **Miriam Chat**: Single-model chat with a friendly AI assistant
- **Compare Mode**: Test the same prompt across multiple models simultaneously
- **Judge Mode**: Let an AI judge rank and critique model responses
- **Research Panel**: Multi-expert research team with synthesis (Starter/Pro only)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes (Edge Runtime)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **LLM Provider**: OpenRouter
- **Billing**: Stripe
- **Hosting**: Vercel

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenRouter API key
- Stripe account (for billing)

### Local Development

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd miriam-lab
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your values in `.env.local`

4. Set up Supabase:
   - Create a new Supabase project
   - Run migrations in order:
     - `supabase/migrations/001_initial_schema.sql`
     - `supabase/migrations/002_shared_results.sql`
     - `supabase/migrations/003_add_usage_log_meta.sql`
     - `supabase/migrations/004_user_sessions.sql`

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Vercel.

## Project Structure

```
miriam-lab/
├── app/                    # Next.js App Router
│   ├── (app)/             # Main application routes
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── page.tsx           # Landing page
├── components/             # React components
├── lib/                    # Utilities and helpers
│   ├── supabase/          # Supabase clients
│   ├── openrouter.ts      # OpenRouter integration
│   ├── stripe.ts          # Stripe configuration
│   └── wallet.ts          # Credit system logic
├── public/                 # Static assets
├── supabase/
│   └── migrations/        # Database migrations
└── vercel.json            # Vercel configuration
```

## Environment Variables

See `.env.example` for all required environment variables.

## Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [BRANDING.md](./BRANDING.md) - Brand guidelines and design tokens
- [COMPLIANCE_REPORT.md](./COMPLIANCE_REPORT.md) - Spec compliance details

## License

Private - All rights reserved
