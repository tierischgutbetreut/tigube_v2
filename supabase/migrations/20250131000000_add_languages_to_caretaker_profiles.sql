-- Migration: Add languages field to caretaker_profiles
-- This allows caretakers to specify the languages they can communicate in

ALTER TABLE caretaker_profiles 
ADD COLUMN languages text[] DEFAULT '{}';

-- Add comment to document the field
COMMENT ON COLUMN caretaker_profiles.languages IS 'Array of languages the caretaker can communicate in (e.g., Deutsch, English, Français)';

-- Update the caretaker_search_view to include languages
DROP VIEW IF EXISTS caretaker_search_view;

CREATE VIEW caretaker_search_view AS
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.first_name || ' ' || u.last_name AS full_name,
  u.city,
  u.plz,
  u.profile_photo_url,
  cp.services,
  cp.animal_types,
  cp.hourly_rate,
  cp.rating,
  cp.review_count,
  cp.is_verified,
  cp.short_about_me,
  cp.long_about_me,
  cp.experience_years,
  cp.experience_description,
  cp.qualifications,
  cp.service_radius,
  cp.home_photos,
  cp.languages  -- Add languages field to the view
FROM users u
JOIN caretaker_profiles cp ON u.id = cp.id
WHERE u.user_type = 'caretaker';

-- Grant appropriate permissions
GRANT SELECT ON caretaker_search_view TO authenticated;
GRANT SELECT ON caretaker_search_view TO anon; 