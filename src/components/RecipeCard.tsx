import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, User, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

interface RecipeCardProps {
  recipe: {
    id: string;
    title: string;
    ingredients: string[];
    preparation_time: number;
    image_url: string | null;
    average_rating: number;
    profiles?: {
      name: string;
    };
  };
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (user) {
      checkFavorite();
    }
  }, [user, recipe.id]);

  const checkFavorite = async () => {
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('recipe_id', recipe.id)
      .eq('user_id', user?.id)
      .maybeSingle();

    setIsFavorite(!!data);
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) return;

    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('recipe_id', recipe.id)
          .eq('user_id', user.id);
        
        toast.success('Removed from favorites');
      } else {
        await supabase
          .from('favorites')
          .insert({ recipe_id: recipe.id, user_id: user.id });
        
        toast.success('Added to favorites');
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-warm transition-smooth cursor-pointer group"
      onClick={() => navigate(`/recipe/${recipe.id}`)}
    >
      <CardHeader className="p-0">
        <div className="aspect-video relative overflow-hidden bg-muted">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-smooth"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-primary">
              <span className="text-6xl">🍳</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-card/80 backdrop-blur-sm hover:bg-card"
            onClick={toggleFavorite}
          >
            <Heart className={`h-5 w-5 ${isFavorite ? 'fill-primary text-primary' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <h3 className="font-display font-semibold text-xl mb-2 line-clamp-1">
          {recipe.title}
        </h3>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{recipe.preparation_time} min</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span>{recipe.average_rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {recipe.ingredients.slice(0, 3).map((ingredient, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {ingredient}
            </Badge>
          ))}
          {recipe.ingredients.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{recipe.ingredients.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center gap-2 text-sm text-muted-foreground">
        <User className="h-4 w-4" />
        <span>{recipe.profiles?.name || 'Anonymous Chef'}</span>
      </CardFooter>
    </Card>
  );
}
