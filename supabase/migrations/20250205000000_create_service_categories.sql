-- Create service_categories table
CREATE TABLE IF NOT EXISTS service_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default service categories
INSERT INTO service_categories (name, description, sort_order) VALUES
  ('Ernährung', 'Fütterung, Diätberatung und ernährungsbezogene Leistungen', 1),
  ('Zubehör', 'Bereitstellung und Pflege von Tierzubehör', 2),
  ('Urlaub mit Tier', 'Reisebegleitung und urlaubsbezogene Betreuung', 3),
  ('Gesundheit', 'Medizinische Betreuung und Gesundheitsvorsorge', 4),
  ('Züchter', 'Zuchtberatung und züchterspezifische Dienstleistungen', 5),
  ('Verein', 'Vereinsaktivitäten und Gemeinschaftsbetreuung', 6),
  ('Training', 'Ausbildung, Erziehung und Verhaltensschulung', 7),
  ('Allgemein', 'Grundlegende Betreuungsleistungen', 8);

-- Create index for better performance
CREATE INDEX idx_service_categories_active ON service_categories(is_active);
CREATE INDEX idx_service_categories_sort_order ON service_categories(sort_order);

-- Enable RLS (Row Level Security)
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read service categories
CREATE POLICY "Allow all users to read service categories" ON service_categories
  FOR SELECT USING (true);

-- Create policy to allow only authenticated users to suggest new categories (if needed later)
CREATE POLICY "Allow authenticated users to read service categories" ON service_categories
  FOR SELECT TO authenticated USING (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_service_categories_updated_at
    BEFORE UPDATE ON service_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();