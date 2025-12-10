-- Fix security definer view by recreating as SECURITY INVOKER
DROP VIEW IF EXISTS public.public_ratings;
CREATE VIEW public.public_ratings 
WITH (security_invoker = true) AS
SELECT 
  id,
  recipe_id,
  rating,
  created_at
FROM public.ratings;

-- Grant access to the view
GRANT SELECT ON public.public_ratings TO anon, authenticated;