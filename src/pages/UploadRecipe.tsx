import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function UploadRecipe() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [preparationTime, setPreparationTime] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const addIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, value: string) => {
    const updated = [...ingredients];
    updated[index] = value;
    setIngredients(updated);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      let imageUrl = null;

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('recipe-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('recipe-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Create recipe
      const { error: insertError } = await supabase
        .from('recipes')
        .insert({
          title,
          ingredients: ingredients.filter(ing => ing.trim() !== ''),
          preparation_time: parseInt(preparationTime),
          image_url: imageUrl,
          author_id: user.id,
          status: 'pending'
        });

      if (insertError) throw insertError;

      toast.success('Recipe uploaded successfully! It will be reviewed by our team.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error uploading recipe:', error);
      toast.error('Failed to upload recipe');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-3xl font-display">Upload Your Recipe</CardTitle>
          <CardDescription>
            Share your culinary creation with the community. Your recipe will be reviewed before being published.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Recipe Title</Label>
              <Input
                id="title"
                placeholder="e.g., Grandma's Chocolate Chip Cookies"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Ingredients */}
            <div className="space-y-2">
              <Label>Ingredients</Label>
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Ingredient ${index + 1}`}
                    value={ingredient}
                    onChange={(e) => updateIngredient(index, e.target.value)}
                    required
                  />
                  {ingredients.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeIngredient(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addIngredient}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Ingredient
              </Button>
            </div>

            {/* Preparation Time */}
            <div className="space-y-2">
              <Label htmlFor="prep-time">Preparation Time (minutes)</Label>
              <Input
                id="prep-time"
                type="number"
                min="1"
                placeholder="30"
                value={preparationTime}
                onChange={(e) => setPreparationTime(e.target.value)}
                required
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="image">Recipe Image</Label>
              {imagePreview && (
                <div className="aspect-video rounded-lg overflow-hidden mb-2">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Uploading...' : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Recipe
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
