-- Remove caretaker_search_view and adjust permissions
-- This migration deprecates the materialized search view in favor of direct queries from the app

-- Safely drop the view if it exists
DROP VIEW IF EXISTS public.caretaker_search_view;

-- No replacement view is created. Frontend now queries `caretaker_profiles` joined with `users`.

-- Note: Ensure RLS policies on `users` and `caretaker_profiles` allow the required read access.

