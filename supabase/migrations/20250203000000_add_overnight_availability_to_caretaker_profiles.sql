-- Migration: Add overnight_availability field to caretaker_profiles
-- This allows caretakers to specify which days they offer overnight stays

ALTER TABLE caretaker_profiles 
ADD COLUMN overnight_availability jsonb DEFAULT '{"Mo": false, "Di": false, "Mi": false, "Do": false, "Fr": false, "Sa": false, "So": false}'::jsonb;

-- Add comment to document the field
COMMENT ON COLUMN caretaker_profiles.overnight_availability IS 'JSON object indicating which days the caretaker offers overnight stays (e.g., {"Mo": true, "Di": false, ...})';

-- Update the caretaker_search_view to include overnight_availability
DROP VIEW IF EXISTS caretaker_search_view;

CREATE VIEW caretaker_search_view AS
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  CASE 
    WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL 
    THEN u.first_name || ' ' || LEFT(u.last_name, 1) || '.'
    WHEN u.first_name IS NOT NULL 
    THEN u.first_name
    ELSE 'Unbekannt'
  END as full_name,
  u.city,
  u.plz,
  u.profile_photo_url,
  cp.animal_types,
  cp.services,
  cp.hourly_rate,
  cp.rating,
  cp.review_count,
  cp.is_verified,
  cp.short_about_me,
  cp.long_about_me,
  cp.experience_years,
  cp.experience_description,
  cp.qualifications,
  cp.languages,
  cp.service_radius,
  cp.home_photos,
  cp.is_commercial,
  cp.company_name,
  cp.tax_number,
  cp.vat_id,
  cp.short_term_available,
  cp.overnight_availability  -- Add overnight_availability field to the view
FROM caretaker_profiles cp
LEFT JOIN users u ON cp.id = u.id
WHERE u.user_type = 'caretaker';

-- Grant appropriate permissions
GRANT SELECT ON caretaker_search_view TO authenticated;
GRANT SELECT ON caretaker_search_view TO anon;
