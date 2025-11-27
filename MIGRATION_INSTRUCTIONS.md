# Database Migration Required

## Favorite Circle Feature

The favorite circle feature requires a database migration to add a new column to the `profiles` table.

### Migration File Location:
`supabase/migrations/20251126000000_add_favorite_circle.sql`

### What the Migration Does:

```sql
-- Add favorite_circle_id to profiles table
ALTER TABLE profiles
ADD COLUMN favorite_circle_id uuid REFERENCES circles(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_profiles_favorite_circle ON profiles(favorite_circle_id);

-- Add comment
COMMENT ON COLUMN profiles.favorite_circle_id IS 'The user''s favorite circle for auto-redirect on login';
```

### Deployment:

This migration is included in the PR and will be automatically applied when:
- The PR is merged and deployed
- Your CI/CD pipeline runs Supabase migrations
- OR someone with database access runs: `supabase db push` (if using Supabase CLI)

### What This Enables:

- ⭐ Users can star/favorite one circle in Settings
- 🚀 On login, users are automatically redirected to their favorite circle
- 📋 If no favorite is set, users see the normal circle selector

### Current Status:

⚠️ **The migration has NOT been applied yet** - that's why you're seeing the error:
"Could not find the 'favorite_circle_id' column of 'profiles' in the schema cache"

The favorite circle UI is ready, but won't work until this migration is applied during deployment.
