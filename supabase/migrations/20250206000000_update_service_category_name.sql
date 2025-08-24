-- Update service category name from 'Gesundheitliches' to 'Gesundheit'
UPDATE service_categories 
SET name = 'Gesundheit', updated_at = NOW() 
WHERE name = 'Gesundheitliches';