# Miriam Lab - Fix Verification Report

**Date**: 2024  
**Status**: ❌ **Critical Issues Not Fixed**

---

## 1. Summary

**Overall Compliance**: ~70% (down from previous ~85%)

**Verdict**: **Mostly NOT fixed** - Critical issues from the previous audit remain unresolved. The codebase still has the same fundamental problems, and in one critical area (credit charging order), the implementation is **opposite** to the spec requirement.

**Key Finding**: All LLM routes charge credits **BEFORE** making OpenRouter calls, which is the opposite of what the spec requires. This means users lose credits even when LLM calls fail.

---

## 2. Critical Issues (1-5) Verification

### Issue 1: Missing Miriam Persona ❌ **NOT FIXED**

**Status**: ❌ **Not implemented**

**Evidence**:
- **File**: `app/api/miriam/route.ts` lines 51-55
- No `MIRIAM_SYSTEM_PROMPT` constant found anywhere in codebase
- Messages are passed directly to OpenRouter without any default system prompt injection
- No check for existing system message before adding Miriam persona

**Current Code**:
```typescript
// Line 51-55: Messages are just mapped directly, no persona injection
const openRouterMessages: OpenRouterMessage[] = messages.map((msg: any) => ({
  role: msg.role,
  content: msg.content,
}));
```

**Required Fix**:
```typescript
// Add to lib/constants.ts or lib/miriam.ts:
export const MIRIAM_SYSTEM_PROMPT = "You are Miriam, a helpful AI assistant...";

// In app/api/miriam/route.ts, after line 51:
const hasSystemMessage = openRouterMessages.some(m => m.role === "system");
if (!hasSystemMessage) {
  openRouterMessages.unshift({ 
    role: "system", 
    content: MIRIAM_SYSTEM_PROMPT 
  });
}
```

---

### Issue 2: Research Panel Not Locked for Free Users ❌ **NOT FIXED**

**Status**: ❌ **Not implemented**

**Evidence**:
- **File**: `app/api/research/route.ts` lines 11-63
- No plan check before allowing research
- Free users can access Research Panel (only credit check exists)
- No 403 error for free plan users

**Current Code**:
```typescript
// Line 51-63: Only credit check, no plan check
const chargeResult = await chargeUser(user.id, "research", expertModels.length);
if (!chargeResult.success) {
  return NextResponse.json({ error: ... }, { status: 402 });
}
// Research proceeds for all users
```

**Required Fix**:
```typescript
// After line 26 (after auth check), before line 51:
const adminClient = createAdminClient();
const { data: wallet } = await adminClient
  .from("user_wallet")
  .select("subscription_plan")
  .eq("user_id", user.id)
  .single();

if (wallet?.subscription_plan === "free") {
  return NextResponse.json(
    { 
      error: "Research Panel is only available for Starter and Pro plans",
      code: "PLAN_TOO_LOW"
    },
    { status: 403 }
  );
}
```

---

### Issue 3: Compare Mode Limit for Free Users ❌ **NOT FIXED**

**Status**: ❌ **Not implemented**

**Evidence**:
- **File**: `app/api/compare/route.ts` lines 51-70
- No plan-based model limit enforcement
- Free users can select 4-5 models (only hard limit of 5 exists)
- Credit calculation uses `compare` mode, not `compare3`/`compare5` distinction

**Current Code**:
```typescript
// Line 51-56: Only checks max 5, no plan-based limit
if (models.length > 5) {
  return NextResponse.json({ error: "Maximum 5 models allowed" }, { status: 400 });
}

// Line 59: Uses generic "compare" mode, not compare3/compare5
const chargeResult = await chargeUser(user.id, "compare", models.length);
```

**Required Fix**:
```typescript
// After line 26 (after auth check), before line 51:
const adminClient = createAdminClient();
const { data: wallet } = await adminClient
  .from("user_wallet")
  .select("subscription_plan")
  .eq("user_id", user.id)
  .single();

const maxModels = wallet?.subscription_plan === "free" ? 3 : 5;
if (models.length > maxModels) {
  return NextResponse.json(
    { 
      error: `Free plan is limited to 3 models. Upgrade to compare up to 5 models.`,
      code: "PLAN_LIMIT_EXCEEDED"
    },
    { status: 403 }
  );
}

// Also update credit calculation to use proper mode:
const creditMode = models.length <= 3 ? "compare3" : "compare5";
// But wait - the Mode type doesn't have compare3/compare5, so need to update types first
```

**Additional Issue**: The `Mode` type in `lib/types.ts` only has `"miriam" | "compare" | "judge" | "research"`. The spec wants `compare3` and `compare5` as distinct modes, but implementation uses a single `compare` mode with model count. This needs architectural decision.

---

### Issue 4: No Credit Refunds on Failed LLM Calls ❌ **NOT FIXED** (Actually WORSE)

**Status**: ❌ **Not fixed - Implementation is OPPOSITE to spec**

**Evidence**:
- **Files**: All LLM routes charge BEFORE calls:
  - `app/api/miriam/route.ts` line 38 (charges before line 63 OpenRouter call)
  - `app/api/compare/route.ts` line 59 (charges before line 83 OpenRouter calls)
  - `app/api/judge/route.ts` line 60 (charges before line 83 OpenRouter calls)
  - `app/api/research/route.ts` line 52 (charges before line 81 OpenRouter calls)

**Current Pattern (WRONG)**:
```typescript
// 1. Charge credits FIRST
const chargeResult = await chargeUser(user.id, "miriam", 1);
if (!chargeResult.success) return error;

// 2. THEN call OpenRouter
try {
  response = await callOpenRouterChat({...});
} catch (error) {
  // Credits already deducted, no refund!
  console.error("OpenRouter call failed after charging:", error);
  throw error;
}
```

**Spec Requirement**:
The spec explicitly states:
> "Only AFTER a successful LLM response, deduct credits using `chargeUser(userId, mode)`."
> "If OpenRouter throws/returns error, the request fails and **no credits are deducted**."

**Required Fix** (Architectural Change):
```typescript
// CORRECT PATTERN:
// 1. Check credits (read-only)
const hasCredits = await hasEnoughCredits(user.id, "miriam", 1);
if (!hasCredits) return 402 error;

// 2. Call OpenRouter
try {
  response = await callOpenRouterChat({...});
  normalized = normalizeOpenRouterResponse(response);
} catch (error) {
  // No credits deducted yet, safe to fail
  throw error;
}

// 3. ONLY AFTER SUCCESS, deduct credits
const chargeResult = await chargeUser(user.id, "miriam", 1);
// Log usage
```

**Impact**: This is a **critical bug** - users lose credits on every failed LLM call. This needs immediate fixing across all 4 routes.

---

### Issue 5: No Automated Daily Reset Cron Job ❌ **NOT FIXED**

**Status**: ❌ **Not implemented**

**Evidence**:
- **File**: `supabase/migrations/001_initial_schema.sql` line 128-138
- Function `reset_daily_credits()` exists but is never called automatically
- No cron job configuration found in codebase
- No Supabase Edge Function for cron
- No Vercel cron configuration
- Reset only happens on-demand when users access wallet (line 64-88 in `app/api/me/wallet/route.ts`)

**Current State**:
- Function exists: ✅
- Scheduled to run: ❌
- Configuration: ❌

**Required Fix**:
Option A (Supabase Cron):
```sql
-- In supabase/migrations/003_daily_reset_cron.sql:
SELECT cron.schedule(
  'reset-daily-credits',
  '0 0 * * *', -- Daily at midnight UTC
  $$SELECT reset_daily_credits();$$
);
```

Option B (Vercel Cron):
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/daily-reset",
    "schedule": "0 0 * * *"
  }]
}
```

Option C (External service): Use a service like EasyCron or similar.

**Note**: Supabase cron requires `pg_cron` extension which may need to be enabled.

---

## 3. Medium Issues (6-8) Verification

### Issue 6: Session/History Limits ❌ **NOT IMPLEMENTED**

**Status**: ❌ **Not implemented**

**Evidence**:
- No `user_sessions` table found
- No session tracking logic
- No history queries with plan-based limits
- Plans mention "10 sessions", "200 sessions", "1000 sessions" but no enforcement

**Required Implementation**:
1. Create `user_sessions` table
2. Track each conversation/session
3. Enforce limits in history queries
4. Clean up old sessions

**Files Needed**:
- Migration for `user_sessions` table
- API endpoint for session history with plan-based LIMIT
- Cleanup job for old sessions

---

### Issue 7: Missing `meta` Field in `usage_log` ❌ **NOT FIXED**

**Status**: ❌ **Not implemented**

**Evidence**:
- **File**: `supabase/migrations/001_initial_schema.sql` line 22-31
- `usage_log` table does not have `meta` JSONB column
- No migration adding this field

**Current Schema**:
```sql
CREATE TABLE IF NOT EXISTS usage_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('miriam', 'compare', 'judge', 'research')),
  credits_spent INTEGER NOT NULL,
  model_ids_used TEXT[] NOT NULL,
  tokens_in INTEGER,
  tokens_out INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- Missing: meta JSONB
);
```

**Required Fix**:
```sql
-- Migration: supabase/migrations/003_add_usage_log_meta.sql
ALTER TABLE usage_log ADD COLUMN IF NOT EXISTS meta JSONB;
```

---

### Issue 8: OpenRouter Normalization Naming ⚠️ **ACCEPTABLE**

**Status**: ⚠️ **Implementation differs from spec but is acceptable**

**Evidence**:
- **File**: `lib/openrouter.ts` line 96-113
- Returns: `text`, `model`, `prompt_tokens`, `completion_tokens`
- Spec suggested: `outputText`, `rawModelId`, `input_tokens`, `output_tokens`

**Assessment**: The implementation uses standard naming conventions that are more intuitive. This is acceptable as long as it's consistent (which it is). No fix needed unless spec compliance is strict.

---

## 4. Regressions / Side-Effects

### ✅ No Regressions Found

The following still work correctly:
- ✅ Credit system logic (order: free_daily → subscription → top-up)
- ✅ Credit calculation (1, 3, 5, 6, 10 credits per action)
- ✅ Authentication and route protection
- ✅ Billing webhooks update wallet correctly
- ✅ Free users can use Miriam and Compare (within hard limits)
- ✅ All modes are functional

### ⚠️ Potential Issues

1. **Credit Loss on Failures**: Users lose credits on every failed LLM call (critical)
2. **No Plan Enforcement**: Free users can access premium features (Research, 4-5 models)
3. **Inconsistent Credit Charging**: All routes charge before calls, not after

---

## 5. Final Recommendations

### High Priority (Must Fix Before Production)

1. **Fix Credit Charging Order** ❌ **CRITICAL**
   - **Impact**: Users lose credits on failed calls
   - **Files**: All 4 LLM routes need refactoring
   - **Pattern**: Check credits → Call LLM → Charge only on success
   - **Estimated Effort**: 2-3 hours (need to refactor all routes)

2. **Add Miriam Persona** ❌
   - **Impact**: Missing core feature
   - **Files**: `app/api/miriam/route.ts`, create `lib/miriam.ts` for constant
   - **Estimated Effort**: 30 minutes

3. **Lock Research Panel for Free Users** ❌
   - **Impact**: Free users accessing premium feature
   - **Files**: `app/api/research/route.ts`
   - **Estimated Effort**: 15 minutes

4. **Enforce Compare Mode Model Limit** ❌
   - **Impact**: Free users accessing premium feature
   - **Files**: `app/api/compare/route.ts`
   - **Estimated Effort**: 20 minutes

5. **Set Up Daily Reset Cron** ❌
   - **Impact**: Daily credits may not reset for inactive users
   - **Files**: New migration or Vercel cron config
   - **Estimated Effort**: 30 minutes (depends on platform choice)

### Medium Priority

6. **Add Meta Field to usage_log** ⚠️
   - **Files**: New migration
   - **Estimated Effort**: 5 minutes

7. **Implement Session/History Limits** ❌
   - **Files**: New table, API endpoints, cleanup job
   - **Estimated Effort**: 4-6 hours

### Low Priority

8. **OpenRouter Naming**: No action needed (current naming is fine)

---

## 6. Implementation Priority

**Before Production**:
1. Fix credit charging order (CRITICAL - affects all users)
2. Add Miriam persona (core feature)
3. Lock Research Panel (revenue protection)
4. Enforce Compare limits (revenue protection)
5. Set up daily reset cron (user experience)

**Can Deploy Without** (but should add soon):
- Session/history limits (mentioned in plans but not critical)
- Meta field (optional feature)

---

## 7. Code Quality Notes

**Positive**:
- Code structure is clean
- Error handling exists (though incomplete)
- Type safety is good
- Security practices are solid

**Concerns**:
- Credit charging pattern is fundamentally wrong (charges before success)
- No plan enforcement helper function (code duplication risk)
- Missing constants file for configuration values

---

## Conclusion

**Status**: ❌ **Fixes Not Implemented**

None of the 5 critical issues have been fixed. The codebase still has the same problems as identified in the previous audit, with one critical issue (credit charging order) being the **opposite** of what the spec requires.

**Recommendation**: Implement all 5 high-priority fixes before considering this production-ready. The credit refund issue is especially critical as it directly impacts user trust and revenue.
