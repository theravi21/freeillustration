-- Create illustrations table for Free Illustration website
CREATE TABLE public.illustrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  topic TEXT,
  orientation TEXT CHECK (orientation IN ('portrait', 'landscape', 'square')),
  style TEXT,
  dominant_color TEXT,
  file_path TEXT NOT NULL,
  thumbnail_path TEXT,
  png_small_path TEXT,
  png_medium_path TEXT,
  png_large_path TEXT,
  svg_path TEXT,
  file_size BIGINT,
  dimensions_width INTEGER,
  dimensions_height INTEGER,
  creator_id UUID,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.illustrations ENABLE ROW LEVEL SECURITY;

-- Create policies for illustrations
CREATE POLICY "Public can view approved illustrations" 
ON public.illustrations 
FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Creators can view their own illustrations" 
ON public.illustrations 
FOR SELECT 
USING (creator_id = auth.uid());

CREATE POLICY "Creators can create illustrations" 
ON public.illustrations 
FOR INSERT 
WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update their own illustrations" 
ON public.illustrations 
FOR UPDATE 
USING (creator_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_illustrations_status ON public.illustrations(status);
CREATE INDEX idx_illustrations_topic ON public.illustrations(topic);
CREATE INDEX idx_illustrations_orientation ON public.illustrations(orientation);
CREATE INDEX idx_illustrations_style ON public.illustrations(style);
CREATE INDEX idx_illustrations_dominant_color ON public.illustrations(dominant_color);
CREATE INDEX idx_illustrations_created_at ON public.illustrations(created_at DESC);
CREATE INDEX idx_illustrations_download_count ON public.illustrations(download_count DESC);
CREATE INDEX idx_illustrations_tags ON public.illustrations USING GIN(tags);

-- Create text search index
CREATE INDEX idx_illustrations_search ON public.illustrations USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_illustrations_updated_at
BEFORE UPDATE ON public.illustrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();