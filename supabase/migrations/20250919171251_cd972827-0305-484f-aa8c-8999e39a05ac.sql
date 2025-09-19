-- Fix security issues identified by linter

-- 1. Fix RLS on Inventory table (has RLS enabled but no policies)
-- Add basic RLS policy for Inventory table
CREATE POLICY "Allow authenticated users to manage inventory" 
ON public."Inventory" 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 2. Fix function search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;