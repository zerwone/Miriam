-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Wallet Table
-- Tracks all credit balances for each user
CREATE TABLE IF NOT EXISTS user_wallet (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  free_daily_credits_remaining INTEGER NOT NULL DEFAULT 10,
  subscription_plan TEXT NOT NULL DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'pro')),
  subscription_credits_remaining INTEGER NOT NULL DEFAULT 0,
  subscription_renews_at TIMESTAMPTZ,
  topup_credits_remaining INTEGER NOT NULL DEFAULT 0,
  last_daily_reset TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Usage Log Table
-- Tracks all credit consumption for analytics
CREATE TABLE IF NOT EXISTS usage_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('miriam', 'compare', 'judge', 'research')),
  credits_spent INTEGER NOT NULL,
  model_ids_used TEXT[] NOT NULL,
  tokens_in INTEGER,
  tokens_out INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscription Events Table
-- Tracks Stripe/Lemon subscription lifecycle
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('start', 'renew', 'cancel', 'upgrade', 'downgrade')),
  plan TEXT NOT NULL,
  credits_added INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Top-up Purchases Table
-- Tracks one-off credit pack purchases
CREATE TABLE IF NOT EXISTS topup_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_type TEXT NOT NULL CHECK (pack_type IN ('mini', 'standard', 'power')),
  credits_added INTEGER NOT NULL,
  amount_paid_cents INTEGER NOT NULL,
  payment_provider TEXT NOT NULL,
  payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_wallet_user_id ON user_wallet(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_log_user_id ON usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_log_created_at ON usage_log(created_at);
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_topup_purchases_user_id ON topup_purchases(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE user_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE topup_purchases ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own wallet
CREATE POLICY "Users can view own wallet"
  ON user_wallet FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can update wallets
CREATE POLICY "Service role can update wallets"
  ON user_wallet FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: Users can only see their own usage logs
CREATE POLICY "Users can view own usage logs"
  ON usage_log FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can insert usage logs
CREATE POLICY "Service role can insert usage logs"
  ON usage_log FOR INSERT
  WITH CHECK (true);

-- Policy: Users can only see their own subscription events
CREATE POLICY "Users can view own subscription events"
  ON subscription_events FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can insert subscription events
CREATE POLICY "Service role can insert subscription events"
  ON subscription_events FOR INSERT
  WITH CHECK (true);

-- Policy: Users can only see their own top-up purchases
CREATE POLICY "Users can view own topup purchases"
  ON topup_purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can insert top-up purchases
CREATE POLICY "Service role can insert topup purchases"
  ON topup_purchases FOR INSERT
  WITH CHECK (true);

-- Function to automatically create wallet on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_wallet (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create wallet when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to reset daily credits (to be called by cron)
CREATE OR REPLACE FUNCTION public.reset_daily_credits()
RETURNS void AS $$
BEGIN
  UPDATE public.user_wallet
  SET 
    free_daily_credits_remaining = 10,
    last_daily_reset = NOW()
  WHERE last_daily_reset < DATE_TRUNC('day', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
