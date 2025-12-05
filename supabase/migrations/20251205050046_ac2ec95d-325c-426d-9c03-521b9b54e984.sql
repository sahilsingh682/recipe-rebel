-- Add steps column to recipes table
ALTER TABLE public.recipes ADD COLUMN steps text[] DEFAULT '{}'::text[];