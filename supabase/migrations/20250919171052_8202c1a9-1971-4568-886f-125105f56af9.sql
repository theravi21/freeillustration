-- Add published boolean column for cleaner moderation workflow
ALTER TABLE public.illustrations 
ADD COLUMN published boolean DEFAULT false;

-- Backfill existing records - keep as unpublished for safety
UPDATE public.illustrations 
SET published = false 
WHERE published IS NULL;

-- Update existing RLS policies to use published column
DROP POLICY IF EXISTS "Public can view approved illustrations" ON public.illustrations;

-- Create new RLS policy for published content
CREATE POLICY "Public can view published illustrations" 
ON public.illustrations 
FOR SELECT 
USING (published = true);

-- Policy for creators to view their own drafts
CREATE POLICY "Creators can view their own illustrations" 
ON public.illustrations 
FOR SELECT 
USING (creator_id = auth.uid());

-- Policy for creators to publish their own content
CREATE POLICY "Creators can update their own illustrations" 
ON public.illustrations 
FOR UPDATE 
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());

-- Policy for creating new illustrations
CREATE POLICY "Creators can create illustrations" 
ON public.illustrations 
FOR INSERT 
WITH CHECK (creator_id = auth.uid() AND published = false);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_illustrations_published ON public.illustrations(published);
CREATE INDEX IF NOT EXISTS idx_illustrations_creator_published ON public.illustrations(creator_id, published);