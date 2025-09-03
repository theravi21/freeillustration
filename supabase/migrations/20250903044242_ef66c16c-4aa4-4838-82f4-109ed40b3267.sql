-- Add unique index on file_path and ensure it's NOT NULL
ALTER TABLE public.illustrations 
ALTER COLUMN file_path SET NOT NULL;

CREATE UNIQUE INDEX idx_illustrations_file_path 
ON public.illustrations(file_path);