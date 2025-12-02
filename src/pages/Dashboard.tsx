import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecipeCard } from '@/components/RecipeCard';
import { Badge } from '@/components/ui/badge';
import { Heart, Upload, Clock } from 'lucide-react';

interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  preparation_time: number;
  image_url: string | null;
  average_rating: number;
  status: string;
  profiles: {
    name: string;
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch user's recipes
      const { data: recipes, error: recipesError } = await supabase
        .from('recipes')
        .select(`
          *,
          profiles:author_id (name)
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (recipesError) throw recipesError;
      setMyRecipes(recipes || []);

      // Fetch favorites
      const { data: favoriteIds, error: favError } = await supabase
        .from('favorites')
        .select('recipe_id')
        .eq('user_id', user.id);

      if (favError) throw favError;

      if (favoriteIds && favoriteIds.length > 0) {
        const { data: favoriteRecipes, error: favRecipesError } = await supabase
          .from('recipes')
          .select(`
            *,
            profiles:author_id (name)
          `)
          .in('id', favoriteIds.map(f => f.recipe_id))
          .eq('status', 'approved');

        if (favRecipesError) throw favRecipesError;
        setFavorites(favoriteRecipes || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      approved: 'default',
      pending: 'secondary',
      rejected: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'secondary'} className="capitalize">
        {status}
      </Badge>
    );
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold mb-2">My Dashboard</h1>
        <p className="text-muted-foreground">Manage your recipes and favorites</p>
      </div>

      <Tabs defaultValue="my-recipes" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="my-recipes" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            My Recipes
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Favorites
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-recipes" className="space-y-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground">Loading...</p>
          ) : myRecipes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">You haven't uploaded any recipes yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myRecipes.map((recipe) => (
                <div key={recipe.id} className="relative">
                  <div className="absolute top-4 right-4 z-10">
                    {getStatusBadge(recipe.status)}
                  </div>
                  <RecipeCard recipe={recipe} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground">Loading...</p>
          ) : favorites.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">You haven't favorited any recipes yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
