-- Add meal_type column to recipes table
ALTER TABLE public.recipes 
ADD COLUMN meal_type text CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')) DEFAULT NULL;

-- Add nutrition columns to recipes table
ALTER TABLE public.recipes 
ADD COLUMN calories integer DEFAULT NULL,
ADD COLUMN protein numeric(6,2) DEFAULT NULL,
ADD COLUMN carbs numeric(6,2) DEFAULT NULL,
ADD COLUMN fat numeric(6,2) DEFAULT NULL;