-- Create storage buckets for illustrations
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('illustrations-raw', 'illustrations-raw', false, 52428800, ARRAY['image/svg+xml', 'image/png']), -- 50MB limit
  ('illustrations-processed', 'illustrations-processed', true, 10485760, ARRAY['image/png', 'image/webp']); -- 10MB limit for processed files

-- Create RLS policies for illustrations-raw bucket (private uploads)
CREATE POLICY "Users can upload their own illustrations" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'illustrations-raw' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (
    LOWER(RIGHT(name, 4)) = '.png' OR 
    LOWER(RIGHT(name, 4)) = '.svg'
  )
);

CREATE POLICY "Users can view their own raw illustrations" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'illustrations-raw' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own raw illustrations" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'illustrations-raw' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own raw illustrations" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'illustrations-raw' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create RLS policies for illustrations-processed bucket (public access)
CREATE POLICY "Public can view processed illustrations" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'illustrations-processed');

CREATE POLICY "Service can manage processed illustrations" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'illustrations-processed')
WITH CHECK (bucket_id = 'illustrations-processed');

-- Update illustrations table to include more file paths
ALTER TABLE public.illustrations 
ADD COLUMN IF NOT EXISTS raw_file_path TEXT,
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS processing_error TEXT,
ADD COLUMN IF NOT EXISTS original_filename TEXT,
ADD COLUMN IF NOT EXISTS original_file_size BIGINT;