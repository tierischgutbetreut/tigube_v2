-- Migration: Create content items (blog/news) + policies
-- Created: 2025-02-03

-- 1) Table: content_items
CREATE TABLE IF NOT EXISTS public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('blog', 'news')),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at TIMESTAMPTZ,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_content_items_updated_at ON public.content_items;
CREATE TRIGGER trg_content_items_updated_at
BEFORE UPDATE ON public.content_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- 3) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_content_items_type ON public.content_items(type);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON public.content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_published_at ON public.content_items(published_at);

-- 4) Enable RLS
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

-- 5) Policies
-- Public can read only published content
DROP POLICY IF EXISTS "Public can view published content" ON public.content_items;
CREATE POLICY "Public can view published content"
  ON public.content_items FOR SELECT
  USING (status = 'published');

-- Admins can view all content
DROP POLICY IF EXISTS "Admins can view all content" ON public.content_items;
CREATE POLICY "Admins can view all content"
  ON public.content_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.is_admin = TRUE
    )
  );

-- Admins can insert/update/delete content
DROP POLICY IF EXISTS "Admins can manage content" ON public.content_items;
CREATE POLICY "Admins can manage content"
  ON public.content_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.is_admin = TRUE
    )
  );

-- 6) Optional: public storage bucket for blog images
-- Create bucket if it does not exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog_images', 'blog_images', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for blog_images
-- Allow public read of blog images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'public read blog images'
  ) THEN
    CREATE POLICY "public read blog images"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'blog_images');
  END IF;
END$$;

-- Allow authenticated users to upload/update/delete in blog_images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'authenticated write blog images'
  ) THEN
    CREATE POLICY "authenticated write blog images"
      ON storage.objects FOR ALL
      USING (bucket_id = 'blog_images' AND auth.role() = 'authenticated')
      WITH CHECK (bucket_id = 'blog_images' AND auth.role() = 'authenticated');
  END IF;
END$$;


