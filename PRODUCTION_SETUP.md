# Production Deployment Setup

## Required Environment Variables

### Supabase Edge Functions (Set in Supabase Dashboard)
1. Go to Project Settings → Edge Functions → Environment Variables
2. Add:
   ```
   OPENAI_API_KEY=your_production_openai_api_key
   ```

### Vercel Deployment (Set in Vercel Dashboard)
1. Go to Project Settings → Environment Variables
2. Add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your_project_id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXTAUTH_SECRET=generate_a_random_secret
   ```

## Deployment Steps

### 1. Deploy Database Changes
```bash
# Link to production project
npx supabase link --project-ref YOUR_PROJECT_ID

# Push database migrations
npx supabase db push

# Deploy Edge Functions
npx supabase functions deploy process-embedding
```

### 2. Deploy Application
```bash
# Push to main branch (triggers Vercel deployment)
git push origin main
```

### 3. Verify Auto-Embedding System
1. Create a test feature in production
2. Check that embedding job is queued
3. Verify embedding is generated within 30 seconds
4. Test AI chat with new feature data

## Environment Variable Sources

- **NEXT_PUBLIC_SUPABASE_URL**: Supabase Project Settings → API
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Supabase Project Settings → API
- **SUPABASE_SERVICE_ROLE_KEY**: Supabase Project Settings → API
- **OPENAI_API_KEY**: OpenAI Dashboard → API Keys
- **NEXTAUTH_SECRET**: Generate with: `openssl rand -base64 32`

## Post-Deployment Checklist

- [ ] Database migrations applied successfully
- [ ] Edge Functions deployed and accessible
- [ ] Environment variables set in both Supabase and Vercel
- [ ] Auto-embedding system working (cron job runs every 30 seconds)
- [ ] All existing features have embeddings (run backfill if needed)
- [ ] Vector index created manually (see step 4 below)
- [ ] AI chat returns results with embedded feature data

## Step 4: Create Vector Index Manually (After Data Population)

Once your embeddings are populated, create the vector index for optimal search performance:

1. **Connect via external tool** (not dashboard due to timeout limits):
   ```bash
   psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres"
   ```

2. **Temporarily increase memory** (if needed):
   ```sql
   SET maintenance_work_mem TO '512MB';
   ```

3. **Create vector index concurrently**:
   ```sql
   CREATE INDEX CONCURRENTLY idx_ai_embeddings_search 
   ON ai_embeddings USING ivfflat (embedding vector_cosine_ops) 
   WITH (lists = 1000);
   ```

4. **Monitor progress** (in another session):
   ```sql
   SELECT phase, round(100.0 * blocks_done / nullif(blocks_total, 0), 1) AS "%" 
   FROM pg_stat_progress_create_index;
   ```

**Note**: For large datasets, consider temporarily upgrading compute tier during index creation, then scaling back down.