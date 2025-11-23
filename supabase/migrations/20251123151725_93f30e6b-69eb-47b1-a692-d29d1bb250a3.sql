-- Remove the security definer view - we'll handle email masking in application code instead
DROP VIEW IF EXISTS circle_invites_masked;