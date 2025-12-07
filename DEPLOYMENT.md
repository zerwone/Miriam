# Deployment Guide - Miriam Lab

This guide will help you deploy Miriam Lab to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Supabase Project**: Set up at [supabase.com](https://supabase.com)
3. **OpenRouter API Key**: Get from [openrouter.ai](https://openrouter.ai)
4. **Stripe Account**: Set up at [stripe.com](https://stripe.com)

## Step 1: Prepare Your Repository

1. Push your code to GitHub, GitLab, or Bitbucket
2. Ensure all files are committed and pushed

## Step 2: Set Up Supabase

1. Create a new Supabase project
2. Run the migrations in order:
   ```bash
   # In Supabase SQL Editor, run these in order:
   - supabase/migrations/001_initial_schema.sql
   - supabase/migrations/002_shared_results.sql
   - supabase/migrations/003_add_usage_log_meta.sql
   - supabase/migrations/004_user_sessions.sql
   ```
3. Get your API keys from Project Settings > API:
   - Project URL
   - `anon` public key
   - `service_role` key (keep secret!)

## Step 3: Set Up Stripe

1. Create products in Stripe Dashboard:
   - **Starter Plan**: $7/month subscription
   - **Pro Plan**: $15/month subscription
   - **Top-up Packs**: Mini ($4), Standard ($12), Power ($40) - one-time payments

2. Get your API keys from Developers > API keys:
   - Secret key (starts with `sk_`)
   - Publishable key (starts with `pk_`)

3. Set up webhook endpoint:
   - Go to Developers > Webhooks
   - Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy the webhook signing secret (starts with `whsec_`)

4. Update `lib/stripe.ts` with your Stripe Price IDs:
   ```typescript
   export const PLANS = {
     free: { /* ... */ },
     starter: {
       stripePriceId: "price_xxxxx", // Your Stripe price ID
       // ...
     },
     pro: {
       stripePriceId: "price_xxxxx", // Your Stripe price ID
       // ...
     },
   };
   ```

## Step 4: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

4. Add Environment Variables (Settings > Environment Variables):

   ```
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
   SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx

   # OpenRouter
   OPENROUTER_API_KEY=sk-or-v1-xxxxx

   # Stripe
   STRIPE_SECRET_KEY=sk_live_xxxxx
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx

   # App URL (for webhooks)
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

   # Cron Secret (optional, for daily reset)
   CRON_SECRET=your-random-secret-string
   ```

5. Click **Deploy**

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Add environment variables:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add OPENROUTER_API_KEY
   vercel env add STRIPE_SECRET_KEY
   vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   vercel env add STRIPE_WEBHOOK_SECRET
   vercel env add NEXT_PUBLIC_APP_URL
   vercel env add CRON_SECRET
   ```

5. Deploy to production:
   ```bash
   vercel --prod
   ```

## Step 5: Configure Vercel Cron

The daily reset cron is already configured in `vercel.json`. To enable it:

1. Go to your Vercel project dashboard
2. Navigate to **Settings > Cron Jobs**
3. Verify the cron job is active:
   - Path: `/api/cron/daily-reset`
   - Schedule: `0 0 * * *` (daily at midnight UTC)

4. (Optional) Add `CRON_SECRET` environment variable for security

## Step 6: Update Stripe Webhook URL

After deployment, update your Stripe webhook endpoint URL:

1. Go to Stripe Dashboard > Developers > Webhooks
2. Update the endpoint URL to: `https://your-app.vercel.app/api/webhooks/stripe`
3. Test the webhook with a test event

## Step 7: Verify Deployment

1. Visit your deployed app: `https://your-app.vercel.app`
2. Test signup/login
3. Test credit charging
4. Test a Miriam chat
5. Test Compare mode
6. Verify Stripe webhooks are working (check Stripe dashboard)

## Troubleshooting

### Build Fails

- Check that all environment variables are set
- Verify `package.json` has all dependencies
- Check build logs in Vercel dashboard

### API Routes Not Working

- Ensure environment variables are set for production
- Check that API routes are in `app/api/` directory
- Verify Edge Runtime compatibility (if using `export const runtime = "edge"`)

### Database Connection Issues

- Verify Supabase URL and keys are correct
- Check Supabase project is active
- Verify RLS policies are set correctly

### Stripe Webhooks Not Working

- Verify webhook URL is correct in Stripe dashboard
- Check webhook secret matches environment variable
- Test webhook in Stripe dashboard > Webhooks > Send test webhook

### Cron Job Not Running

- Verify cron is enabled in Vercel dashboard
- Check cron endpoint returns 200 status
- Verify `CRON_SECRET` is set if using authentication

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only) |
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `NEXT_PUBLIC_APP_URL` | Recommended | Your app URL (for webhooks) |
| `CRON_SECRET` | Optional | Secret for cron endpoint authentication |

## Post-Deployment Checklist

- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Stripe products created and price IDs updated
- [ ] Stripe webhook configured
- [ ] Vercel cron job enabled
- [ ] Test signup/login
- [ ] Test credit system
- [ ] Test all modes (Miriam, Compare, Judge, Research)
- [ ] Test billing flow
- [ ] Verify analytics tracking
- [ ] Check error logs in Vercel dashboard

## Support

For issues:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Check Stripe webhook logs
4. Review application logs in browser console
