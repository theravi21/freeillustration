-- Add published boolean column for cleaner moderation workflow
ALTER TABLE public.illustrations 
ADD COLUMN IF NOT EXISTS published boolean DEFAULT false;

-- Backfill existing records - keep as unpublished for safety
UPDATE public.illustrations 
SET published = false 
WHERE published IS NULL;

-- Drop all existing RLS policies to recreate them properly
DROP POLICY IF EXISTS "Public can view approved illustrations" ON public.illustrations;
DROP POLICY IF EXISTS "Creators can view their own illustrations" ON public.illustrations;
DROP POLICY IF EXISTS "Creators can update their own illustrations" ON public.illustrations;
DROP POLICY IF EXISTS "Creators can create illustrations" ON public.illustrations;

-- Create new comprehensive RLS policies for published/draft workflow
CREATE POLICY "Public can view published illustrations" 
ON public.illustrations 
FOR SELECT 
USING (published = true);

CREATE POLICY "Creators can view their own drafts" 
ON public.illustrations 
FOR SELECT 
USING (creator_id = auth.uid());

CREATE POLICY "Creators can update their own illustrations" 
ON public.illustrations 
FOR UPDATE 
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can create new drafts" 
ON public.illustrations 
FOR INSERT 
WITH CHECK (creator_id = auth.uid());

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_illustrations_published ON public.illustrations(published);
CREATE INDEX IF NOT EXISTS idx_illustrations_creator_published ON public.illustrations(creator_id, published);