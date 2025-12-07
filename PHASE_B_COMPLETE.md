# Phase B Complete: Accounts & Wallet

## What's Been Implemented

### 1. Supabase Integration ✅
- **Client setup**: Browser and server-side Supabase clients
- **Admin client**: Service role client for elevated permissions
- **Middleware**: Route protection and session management

### 2. Database Schema ✅
- **user_wallet**: Tracks all credit balances (free daily, subscription, top-up)
- **usage_log**: Records all credit consumption for analytics
- **subscription_events**: Tracks subscription lifecycle
- **topup_purchases**: Records credit pack purchases
- **RLS policies**: Row-level security for data protection
- **Auto-wallet creation**: Trigger creates wallet on user signup
- **Daily reset function**: SQL function to reset daily credits

### 3. Authentication ✅
- **Sign in page**: `/auth/signin`
- **Sign up page**: `/auth/signup`
- **Protected routes**: `/app/*` requires authentication
- **Session management**: Automatic session refresh via middleware

### 4. Wallet Management ✅
- **Credit calculation**: Functions to calculate credits needed per action
- **Credit deduction**: Smart deduction order (free daily → subscription → top-up)
- **Balance checking**: Validates sufficient credits before actions
- **Daily reset**: Automatic reset of free daily credits

### 5. Credit Charging ✅
- **Charge API**: `/api/charge` endpoint for credit deduction
- **Shared charge logic**: Reusable `chargeUser()` function
- **Integrated into APIs**: Both `/api/miriam` and `/api/compare` charge credits
- **Usage logging**: All actions logged to `usage_log` table

### 6. Frontend Integration ✅
- **Credits display**: Real-time credit balance in header
- **User menu**: Sign out and user info
- **Error handling**: Insufficient credits errors shown to users
- **Auto-refresh**: Credits refresh after actions

## Database Migration

Run the migration file in your Supabase SQL editor:
```bash
supabase/migrations/001_initial_schema.sql
```

Or apply it via Supabase Dashboard → SQL Editor.

## Environment Variables Required

Add these to your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Credit System

### Credit Costs
- **Miriam chat**: 1 credit per message
- **Compare (≤3 models)**: 3 credits
- **Compare (4-5 models)**: 5 credits
- **Judge mode**: 6 credits (not yet implemented)
- **Research panel**: 10 credits (not yet implemented)

### Credit Sources
1. **Free Daily Credits**: 10 credits/day (resets at midnight)
2. **Subscription Credits**: Based on plan (Free: 0, Starter: 1000/mo, Pro: 3000/mo)
3. **Top-up Credits**: Purchased credit packs

### Deduction Order
Credits are deducted in this order:
1. Free daily credits first
2. Then subscription credits
3. Finally top-up credits

## Testing

1. **Sign up**: Create a new account at `/auth/signup`
2. **Check wallet**: Wallet is auto-created with 10 free daily credits
3. **Use credits**: Send messages in Miriam chat or compare models
4. **Watch credits**: Credits decrease in real-time in the header
5. **Test limits**: Try to use more credits than available to see error handling

## Next Steps (Phase C)

- Implement Judge mode API and UI
- Implement Research Panel API and UI
- Add more sophisticated error handling
- Add credit purchase flow (Phase D)
