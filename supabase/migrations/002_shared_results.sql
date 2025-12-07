-- Shared Results Table
-- Stores shareable links for Compare/Judge/Research results
CREATE TABLE IF NOT EXISTS shared_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('compare', 'judge', 'research')),
  title TEXT,
  result_data JSONB NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shared_results_user_id ON shared_results(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_results_public ON shared_results(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_shared_results_created_at ON shared_results(created_at);

-- Row Level Security
ALTER TABLE shared_results ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own shared results
CREATE POLICY "Users can view own shared results"
  ON shared_results FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Public results can be viewed by anyone
CREATE POLICY "Public results are viewable by all"
  ON shared_results FOR SELECT
  USING (is_public = true);

-- Policy: Users can create shared results
CREATE POLICY "Users can create shared results"
  ON shared_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can manage all shared results
CREATE POLICY "Service role can manage shared results"
  ON shared_results FOR ALL
  USING (true)
  WITH CHECK (true);
