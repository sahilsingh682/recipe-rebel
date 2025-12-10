-- Fix 1: Create a public view for ratings that hides user_id
CREATE OR REPLACE VIEW public.public_ratings AS
SELECT 
  id,
  recipe_id,
  rating,
  created_at
FROM public.ratings;

-- Grant access to the view
GRANT SELECT ON public.public_ratings TO anon, authenticated;

-- Fix 2: Update recipe-images bucket with file size limit and allowed MIME types
UPDATE storage.buckets
SET 
  file_size_limit = 5242880, -- 5MB limit
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'recipe-images';