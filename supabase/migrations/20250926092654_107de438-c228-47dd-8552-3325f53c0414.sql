-- Create function to increment download count
CREATE OR REPLACE FUNCTION public.increment_download_count(illustration_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.illustrations 
  SET download_count = download_count + 1 
  WHERE id = illustration_id;
END;
$$;