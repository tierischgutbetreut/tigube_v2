-- Add short_term_available field to caretaker_profiles
-- This allows caretakers to indicate if they are available for short-term bookings

ALTER TABLE caretaker_profiles
ADD COLUMN IF NOT EXISTS short_term_available boolean DEFAULT false;

-- Add comment to document the field
COMMENT ON COLUMN caretaker_profiles.short_term_available IS 'Indicates if the caretaker is currently available for short-term bookings';

-- Update the caretaker_search_view to include short_term_available
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
  cp.short_term_available  -- Add short_term_available field to the view
FROM caretaker_profiles cp
LEFT JOIN users u ON cp.id = u.id
WHERE u.user_type = 'caretaker';

-- Grant appropriate permissions
GRANT SELECT ON caretaker_search_view TO authenticated;
GRANT SELECT ON caretaker_search_view TO anon;