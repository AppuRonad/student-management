-- Run this in Supabase SQL Editor
-- This sets the database timezone to IST so timestamps display as IST
-- in the Supabase Table Editor dashboard view.
-- Your app already converts to IST in the UI — this is only for the dashboard view.

-- Set session timezone (applies to current SQL session only)
SET timezone = 'Asia/Kolkata';

-- To make it permanent for the database:
ALTER DATABASE postgres SET timezone = 'Asia/Kolkata';

-- Verify it worked — should show IST time now
SELECT
  id,
  student_id,
  sender_id,
  created_at,
  created_at AT TIME ZONE 'Asia/Kolkata' AS created_at_ist
FROM messages
ORDER BY created_at DESC
LIMIT 10;
