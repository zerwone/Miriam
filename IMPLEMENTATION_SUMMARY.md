# Miriam Lab - Implementation Summary

## ✅ Completed Phases

### Phase A: Foundation (Weeks 1-2) ✅
- **Miriam Chat**: Single-model chat interface with message history
- **Compare Mode**: Side-by-side comparison of up to 5 models
- **OpenRouter Integration**: Centralized API client with error handling
- **Basic UI**: Navigation, landing page, responsive design

### Phase B: Accounts & Wallet (Weeks 3-4) ✅
- **Supabase Integration**: Authentication and database setup
- **User Authentication**: Sign in/sign up pages with protected routes
- **Wallet System**: Credit tracking (free daily, subscription, top-up)
- **Credit Charging**: Automatic deduction for all actions
- **Usage Logging**: All actions logged for analytics
- **Database Schema**: Complete schema with RLS policies

### Phase C: Advanced Modes (Weeks 5-7) ✅
- **Judge Mode**: AI judge ranks and critiques model responses
  - Supports up to 3 candidate models
  - Configurable judge model
  - Visual ranking with scores and comments
- **Research Panel**: Multiple expert models + synthesizer
  - 2-4 expert models with different perspectives
  - Synthesized final report
  - Follow-up questions generation

### Phase D: Billing & Plans (Weeks 8-9) ✅
- **Stripe Integration**: Full payment processing
- **Subscription Plans**: Free, Starter ($7/mo), Pro ($15/mo)
- **Top-up Packs**: Mini ($4), Standard ($12), Power ($40)
- **Webhook Handlers**: Complete subscription lifecycle management
- **Pricing Page**: Beautiful plan comparison and credit pack display
- **Account Page**: Credit balance, plan management, top-up interface

## 📊 Credit System

### Credit Costs
- Miriam chat: **1 credit**
- Compare (≤3 models): **3 credits**
- Compare (4-5 models): **5 credits**
- Judge mode: **6 credits**
- Research panel: **10 credits**

### Credit Sources
1. **Free Daily**: 10 credits/day (resets at midnight UTC)
2. **Subscription**: Based on plan (Starter: 1,000/mo, Pro: 3,000/mo)
3. **Top-up**: One-time purchases (never expire)

### Deduction Order
Credits are deducted in this order:
1. Free daily credits
2. Subscription credits
3. Top-up credits

## 🗄️ Database Schema

### Tables
- **user_wallet**: Credit balances and subscription info
- **usage_log**: All credit consumption for analytics
- **subscription_events**: Subscription lifecycle tracking
- **topup_purchases**: Credit pack purchase history

### Features
- Auto-wallet creation on signup (database trigger)
- Row-level security (RLS) policies
- Daily credit reset function

## 🔧 Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router) + React + TypeScript
- **Styling**: Tailwind CSS with dark mode
- **Database/Auth**: Supabase (PostgreSQL + Auth)
- **LLM Provider**: OpenRouter
- **Payments**: Stripe
- **Deployment**: Vercel-ready

## 📁 Project Structure

```
/app
  /(app)              # Main app routes
    /account          # Billing & account management
    /compare          # Compare mode
    /judge            # Judge mode
    /research         # Research panel
    page.tsx          # Miriam chat
  /api
    /checkout         # Stripe checkout endpoints
    /judge            # Judge mode API
    /me/wallet        # Wallet balance API
    /miriam           # Chat API
    /research         # Research panel API
    /webhooks/stripe  # Stripe webhook handler
  /auth               # Authentication pages
  /pricing            # Pricing page
/lib
  charge.ts           # Credit charging logic
  openrouter.ts       # OpenRouter client
  stripe.ts           # Stripe configuration
  supabase/           # Supabase clients
  wallet.ts           # Wallet utilities
  types.ts            # TypeScript types
/supabase
  /migrations         # Database migrations
```

## 🚀 Setup Instructions

### 1. Environment Variables

Create `.env.local`:
```bash
# OpenRouter
OPENROUTER_API_KEY=your_key
OPENROUTER_HTTP_REFERER=https://miriam-lab.com
OPENROUTER_X_TITLE=Miriam Lab

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_STARTER_PRICE_ID=price_xxxxx
STRIPE_PRO_PRICE_ID=price_xxxxx
STRIPE_TOPUP_MINI_PRICE_ID=price_xxxxx
STRIPE_TOPUP_STANDARD_PRICE_ID=price_xxxxx
STRIPE_TOPUP_POWER_PRICE_ID=price_xxxxx
```

### 2. Database Setup

Run the migration in Supabase SQL Editor:
```bash
supabase/migrations/001_initial_schema.sql
```

### 3. Stripe Setup

1. Create products in Stripe Dashboard (see `PHASE_D_COMPLETE.md`)
2. Set up webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Add environment variables with Price IDs

### 4. Run

```bash
npm install
npm run dev
```

## 📈 Next Steps (Future Phases)

### Phase E: Observability & Analytics
- Usage dashboards
- Model performance tracking
- Cost analysis per user
- Prompt analytics

### Phase F: Growth Features
- Shareable links for results
- Prompt templates and presets
- Team workspaces
- Export functionality

## 🎯 Key Features

✅ **Multi-model comparison** - Test same prompt across multiple models
✅ **AI judge** - Automated ranking and critique
✅ **Research panel** - Collaborative analysis with synthesis
✅ **Credit system** - Hybrid subscription + usage model
✅ **Full billing** - Stripe integration with subscriptions and top-ups
✅ **User accounts** - Complete authentication and wallet management
✅ **Real-time credits** - Live balance updates
✅ **Usage tracking** - Complete analytics foundation

## 📝 Notes

- All API routes use Edge Runtime for performance
- Credit charging happens before API calls (prevents abuse)
- Daily credits reset automatically via database function
- Subscription credits reset on renewal via webhook
- Top-up credits never expire
- All actions are logged for analytics

## 🔒 Security

- Row-level security (RLS) on all tables
- Service role key only used server-side
- Stripe webhook signature verification
- Protected API routes with authentication
- Environment variables for all secrets

---

**Status**: Phases A-D Complete ✅
**Ready for**: Production deployment (after Stripe/Supabase setup)
