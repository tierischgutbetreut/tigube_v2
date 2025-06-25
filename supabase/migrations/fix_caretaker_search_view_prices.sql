-- Fix caretaker_search_view to include missing fields: prices and is_commercial
-- This ensures the search functionality works properly

DROP VIEW IF EXISTS caretaker_search_view;

CREATE VIEW caretaker_search_view AS
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  CASE 
    WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL 
    THEN u.first_name || ' ' || SUBSTRING(u.last_name, 1, 1) || '.'
    WHEN u.first_name IS NOT NULL 
    THEN u.first_name
    ELSE 'Unbekannt'
  END as full_name,
  u.city,
  u.plz,
  u.profile_photo_url,
  cp.animal_types,
  cp.services,
  cp.prices,
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
  cp.vat_id
FROM caretaker_profiles cp
LEFT JOIN users u ON cp.id = u.id
WHERE u.user_type = 'caretaker'
  AND cp.is_active = true;  -- Only show active caretakers

-- Grant appropriate permissions
GRANT SELECT ON caretaker_search_view TO authenticated;
GRANT SELECT ON caretaker_search_view TO anon; 