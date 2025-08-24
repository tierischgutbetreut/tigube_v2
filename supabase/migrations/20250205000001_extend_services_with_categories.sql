-- Extend services field to support both string arrays and objects with categories
-- This migration maintains backward compatibility while adding category support

-- Add a new column for categorized services (keeping old services for compatibility)
ALTER TABLE caretaker_profiles 
ADD COLUMN IF NOT EXISTS services_with_categories JSONB DEFAULT '[]'::jsonb;

-- Create a function to migrate existing string services to categorized format
CREATE OR REPLACE FUNCTION migrate_services_to_categorized()
RETURNS void AS $$
DECLATE
    profile_record RECORD;
    service_text TEXT;
    categorized_services JSONB := '[]'::jsonb;
    default_category_id INTEGER;
BEGIN
    -- Get the "Allgemein" category ID as default
    SELECT id INTO default_category_id FROM service_categories WHERE name = 'Allgemein' LIMIT 1;
    
    -- If no default category exists, create it
    IF default_category_id IS NULL THEN
        INSERT INTO service_categories (name, description, sort_order) 
        VALUES ('Allgemein', 'Grundlegende Betreuungsleistungen', 8)
        RETURNING id INTO default_category_id;
    END IF;

    -- Migrate existing services for each caretaker profile
    FOR profile_record IN 
        SELECT id, services 
        FROM caretaker_profiles 
        WHERE services IS NOT NULL 
        AND (services_with_categories IS NULL OR services_with_categories = '[]'::jsonb)
    LOOP
        categorized_services := '[]'::jsonb;
        
        -- Convert each service string to categorized object
        IF profile_record.services IS NOT NULL THEN
            FOR service_text IN 
                SELECT jsonb_array_elements_text(profile_record.services::jsonb)
            LOOP
                categorized_services := categorized_services || jsonb_build_array(
                    jsonb_build_object(
                        'name', service_text,
                        'category_id', default_category_id,
                        'category_name', 'Allgemein'
                    )
                );
            END LOOP;
        END IF;
        
        -- Update the profile with categorized services
        UPDATE caretaker_profiles 
        SET services_with_categories = categorized_services
        WHERE id = profile_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the migration function
SELECT migrate_services_to_categorized();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_caretaker_profiles_services_with_categories 
ON caretaker_profiles USING GIN (services_with_categories);

-- Create a function to get services as strings (for backward compatibility)
CREATE OR REPLACE FUNCTION get_services_as_strings(profile_services_with_categories JSONB)
RETURNS TEXT[] AS $$
BEGIN
    IF profile_services_with_categories IS NULL OR profile_services_with_categories = '[]'::jsonb THEN
        RETURN ARRAY[]::TEXT[];
    END IF;
    
    RETURN ARRAY(
        SELECT jsonb_extract_path_text(service, 'name')
        FROM jsonb_array_elements(profile_services_with_categories) AS service
        WHERE jsonb_extract_path_text(service, 'name') IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a function to get services by category
CREATE OR REPLACE FUNCTION get_services_by_category(profile_services_with_categories JSONB, category_name_filter TEXT)
RETURNS TEXT[] AS $$
BEGIN
    IF profile_services_with_categories IS NULL OR profile_services_with_categories = '[]'::jsonb THEN
        RETURN ARRAY[]::TEXT[];
    END IF;
    
    RETURN ARRAY(
        SELECT jsonb_extract_path_text(service, 'name')
        FROM jsonb_array_elements(profile_services_with_categories) AS service
        WHERE jsonb_extract_path_text(service, 'category_name') = category_name_filter
        AND jsonb_extract_path_text(service, 'name') IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update the caretaker_search_view to include categorized services
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
  -- Keep backward compatibility: return services as string array
  COALESCE(
    get_services_as_strings(cp.services_with_categories),
    CASE 
      WHEN cp.services IS NOT NULL THEN 
        ARRAY(SELECT jsonb_array_elements_text(cp.services::jsonb))
      ELSE ARRAY[]::TEXT[]
    END
  ) as services,
  cp.services_with_categories,
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
WHERE u.user_type = 'caretaker';

-- Drop the migration function as it's no longer needed
DROP FUNCTION IF EXISTS migrate_services_to_categorized();

COMMENT ON COLUMN caretaker_profiles.services_with_categories IS 'Services with category information in JSONB format: [{"name": "Service Name", "category_id": 1, "category_name": "Category Name"}]';
COMMENT ON COLUMN caretaker_profiles.services IS 'Legacy services field - kept for backward compatibility';