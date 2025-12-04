import { z } from 'zod';

export const recipeSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  ingredients: z.array(
    z.string()
      .min(1, 'Ingredient cannot be empty')
      .max(200, 'Ingredient must be less than 200 characters')
  )
    .min(1, 'At least one ingredient is required')
    .max(50, 'Maximum 50 ingredients allowed'),
  preparationTime: z.number()
    .min(1, 'Preparation time must be at least 1 minute')
    .max(1440, 'Preparation time must be less than 24 hours'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner']).optional(),
  calories: z.number().min(0).max(10000).optional(),
  protein: z.number().min(0).max(1000).optional(),
  carbs: z.number().min(0).max(1000).optional(),
  fat: z.number().min(0).max(1000).optional(),
});

export const commentSchema = z.object({
  text: z.string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be less than 1000 characters')
    .trim(),
});

export type RecipeFormData = z.infer<typeof recipeSchema>;
export type CommentFormData = z.infer<typeof commentSchema>;
