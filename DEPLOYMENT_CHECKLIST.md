# Vercel Deployment Checklist

## Pre-Deployment

### ✅ Code Ready
- [x] Build passes (`npm run build`)
- [x] TypeScript compiles without errors
- [x] All dependencies in `package.json`
- [x] `vercel.json` configured
- [x] `next.config.js` optimized

### 📋 Environment Variables to Set

Set these in Vercel Dashboard > Settings > Environment Variables:

#### Required
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (keep secret!)
- [ ] `OPENROUTER_API_KEY` - Your OpenRouter API key
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key (use `sk_live_...` for production)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

#### Recommended
- [ ] `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., `https://miriam-lab.vercel.app`)
- [ ] `CRON_SECRET` - Random secret string for cron endpoint security

### 🗄️ Database Setup

- [ ] Create Supabase project
- [ ] Run migration `001_initial_schema.sql`
- [ ] Run migration `002_shared_results.sql`
- [ ] Run migration `003_add_usage_log_meta.sql`
- [ ] Run migration `004_user_sessions.sql`
- [ ] Verify RLS policies are active
- [ ] Test database connection

### 💳 Stripe Setup

- [ ] Create Starter subscription product ($7/month)
- [ ] Create Pro subscription product ($15/month)
- [ ] Create top-up products:
  - [ ] Mini pack ($4, 200 credits)
  - [ ] Standard pack ($12, 1000 credits)
  - [ ] Power pack ($40, 5000 credits)
- [ ] Update `lib/stripe.ts` with actual Stripe Price IDs
- [ ] Create webhook endpoint in Stripe dashboard
- [ ] Configure webhook events:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`

### 🚀 Deployment Steps

1. **Push to Git**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Configure project (Next.js preset)
   - Add all environment variables
   - Deploy

3. **Configure Vercel Cron**
   - Go to Settings > Cron Jobs
   - Verify `/api/cron/daily-reset` is active
   - Schedule: `0 0 * * *` (daily at midnight UTC)

4. **Update Stripe Webhook**
   - Update webhook URL to: `https://your-app.vercel.app/api/webhooks/stripe`
   - Test webhook with test event

### ✅ Post-Deployment Testing

- [ ] Landing page loads
- [ ] Sign up works
- [ ] Sign in works
- [ ] Miriam chat works
- [ ] Compare mode works (test with 2-3 models)
- [ ] Judge mode works
- [ ] Research panel works (if on Starter/Pro)
- [ ] Credit system works (check balance updates)
- [ ] Stripe checkout works (test with test card)
- [ ] Webhook receives events (check Stripe dashboard)
- [ ] Daily reset cron runs (check logs after midnight UTC)

### 🔍 Monitoring

- [ ] Set up Vercel Analytics (optional)
- [ ] Monitor error logs in Vercel dashboard
- [ ] Check Supabase logs for database issues
- [ ] Monitor Stripe webhook delivery
- [ ] Set up error alerts (optional)

## Quick Deploy Commands

### Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (preview)
vercel

# Deploy to production
vercel --prod
```

### Via Git Push

1. Push to your main branch
2. Vercel will auto-deploy if connected to your repo

## Troubleshooting

### Build Fails
- Check environment variables are set
- Verify all dependencies in `package.json`
- Check build logs in Vercel dashboard

### API Routes Return 500
- Check environment variables
- Verify Supabase connection
- Check API route logs in Vercel dashboard

### Stripe Webhooks Not Working
- Verify webhook URL is correct
- Check webhook secret matches
- Test webhook in Stripe dashboard

### Cron Not Running
- Check Vercel cron is enabled
- Verify endpoint returns 200
- Check cron logs in Vercel dashboard

## Production Checklist

Before going live:
- [ ] All environment variables set
- [ ] Database migrations complete
- [ ] Stripe products configured
- [ ] Webhook tested
- [ ] All features tested
- [ ] Error monitoring set up
- [ ] Domain configured (if using custom domain)
- [ ] SSL certificate active (automatic with Vercel)
