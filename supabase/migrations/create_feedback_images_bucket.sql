-- Create feedback-images bucket for storing feedback form images
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-images', 'feedback-images', true);

-- Create RLS policy to allow anyone to upload feedback images
CREATE POLICY "Allow public uploads to feedback-images bucket"
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'feedback-images');

-- Create RLS policy to allow public read access to feedback images
CREATE POLICY "Allow public read access to feedback-images bucket"
ON storage.objects FOR SELECT 
USING (bucket_id = 'feedback-images');

-- Create RLS policy to allow delete for uploaded images (for cleanup)
CREATE POLICY "Allow delete for feedback-images bucket"
ON storage.objects FOR DELETE 
USING (bucket_id = 'feedback-images'); 