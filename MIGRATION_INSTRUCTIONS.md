# Database Migration Instructions

## Favorite Circle Feature

The favorite circle feature requires a database migration to add a new column to the `profiles` table.

### To Apply the Migration:

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Run the following SQL:

```sql
-- Add favorite_circle_id to profiles table
ALTER TABLE profiles
ADD COLUMN favorite_circle_id uuid REFERENCES circles(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_profiles_favorite_circle ON profiles(favorite_circle_id);

-- Add comment
COMMENT ON COLUMN profiles.favorite_circle_id IS 'The user''s favorite circle for auto-redirect on login';
```

Alternatively, you can find this migration in:
`supabase/migrations/20251126000000_add_favorite_circle.sql`

### What This Enables:

- Users can star/favorite one circle in Settings
- On login, users are automatically redirected to their favorite circle
- If no favorite is set, users see the normal circle selector

### Verification:

After running the migration, check that:
1. The `profiles` table has a `favorite_circle_id` column
2. The index `idx_profiles_favorite_circle` exists
3. Users can successfully star circles in Settings without errors
