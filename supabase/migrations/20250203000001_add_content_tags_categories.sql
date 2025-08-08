-- Migration: Add content categories & tags with relations and RLS
-- Created: 2025-02-03

-- 1) Categories
CREATE TABLE IF NOT EXISTS public.content_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Tags
CREATE TABLE IF NOT EXISTS public.content_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) Relations
CREATE TABLE IF NOT EXISTS public.content_item_categories (
  content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.content_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (content_item_id, category_id)
);

CREATE TABLE IF NOT EXISTS public.content_item_tags (
  content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.content_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (content_item_id, tag_id)
);

-- 4) Triggers for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_content_categories_updated_at ON public.content_categories;
CREATE TRIGGER trg_content_categories_updated_at
BEFORE UPDATE ON public.content_categories
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_content_tags_updated_at ON public.content_tags;
CREATE TRIGGER trg_content_tags_updated_at
BEFORE UPDATE ON public.content_tags
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- 5) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_content_categories_slug ON public.content_categories(slug);
CREATE INDEX IF NOT EXISTS idx_content_tags_slug ON public.content_tags(slug);
CREATE INDEX IF NOT EXISTS idx_item_categories_item ON public.content_item_categories(content_item_id);
CREATE INDEX IF NOT EXISTS idx_item_categories_category ON public.content_item_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_item_tags_item ON public.content_item_tags(content_item_id);
CREATE INDEX IF NOT EXISTS idx_item_tags_tag ON public.content_item_tags(tag_id);

-- 6) Enable RLS
ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_item_tags ENABLE ROW LEVEL SECURITY;

-- 7) Policies
-- Public can view categories and tags
DROP POLICY IF EXISTS "Public can view categories" ON public.content_categories;
CREATE POLICY "Public can view categories" ON public.content_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view tags" ON public.content_tags;
CREATE POLICY "Public can view tags" ON public.content_tags
  FOR SELECT USING (true);

-- Public can view item relations only for published items
DROP POLICY IF EXISTS "Public view item categories for published items" ON public.content_item_categories;
CREATE POLICY "Public view item categories for published items" ON public.content_item_categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.content_items ci
      WHERE ci.id = content_item_id AND ci.status = 'published'
    )
  );

DROP POLICY IF EXISTS "Public view item tags for published items" ON public.content_item_tags;
CREATE POLICY "Public view item tags for published items" ON public.content_item_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.content_items ci
      WHERE ci.id = content_item_id AND ci.status = 'published'
    )
  );

-- Admins can view all
DROP POLICY IF EXISTS "Admins can view all categories" ON public.content_categories;
CREATE POLICY "Admins can view all categories" ON public.content_categories
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  );

DROP POLICY IF EXISTS "Admins can view all tags" ON public.content_tags;
CREATE POLICY "Admins can view all tags" ON public.content_tags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  );

DROP POLICY IF EXISTS "Admins can view all item categories" ON public.content_item_categories;
CREATE POLICY "Admins can view all item categories" ON public.content_item_categories
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  );

DROP POLICY IF EXISTS "Admins can view all item tags" ON public.content_item_tags;
CREATE POLICY "Admins can view all item tags" ON public.content_item_tags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  );

-- Admins can manage (insert/update/delete)
DROP POLICY IF EXISTS "Admins can manage categories" ON public.content_categories;
CREATE POLICY "Admins can manage categories" ON public.content_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  );

DROP POLICY IF EXISTS "Admins can manage tags" ON public.content_tags;
CREATE POLICY "Admins can manage tags" ON public.content_tags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  );

DROP POLICY IF EXISTS "Admins can manage item categories" ON public.content_item_categories;
CREATE POLICY "Admins can manage item categories" ON public.content_item_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  );

DROP POLICY IF EXISTS "Admins can manage item tags" ON public.content_item_tags;
CREATE POLICY "Admins can manage item tags" ON public.content_item_tags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  );


