import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RecipeCard } from '@/components/RecipeCard';
import { Search, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  preparation_time: number;
  image_url: string | null;
  average_rating: number;
  author_id: string;
  meal_type: string | null;
  profiles: {
    name: string;
  };
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mealTypeFilter, setMealTypeFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecipes();
  }, []);

  // Show loading state while auth is initializing (important for OAuth callback)
  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const fetchRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          profiles:author_id (name)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = recipe.title.toLowerCase().includes(query) ||
      recipe.ingredients.some((ing) => ing.toLowerCase().includes(query));
    const matchesMealType = mealTypeFilter === 'all' || recipe.meal_type === mealTypeFilter;
    return matchesSearch && matchesMealType;
  });

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-gradient-primary">
        <div className="text-center space-y-6 p-8">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-white drop-shadow-lg">
            Welcome to Recipe Rebel
          </h1>
          <p className="text-xl text-white/90 max-w-2xl">
            Join our community of food lovers. Share your recipes, discover new flavors, and get personalized diet advice from our AI Dietician.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="shadow-warm text-lg"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
          Discover Amazing Recipes
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Share your culinary creations and explore recipes from our community
        </p>

        {/* Search and Filter */}
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by recipe name or ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={mealTypeFilter} onValueChange={setMealTypeFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Meal Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Meals</SelectItem>
              <SelectItem value="breakfast">Breakfast</SelectItem>
              <SelectItem value="lunch">Lunch</SelectItem>
              <SelectItem value="dinner">Dinner</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => navigate('/upload')} className="shadow-warm">
            <Plus className="h-5 w-5 mr-2" />
            Upload Recipe
          </Button>
        </div>
      </div>

      {/* Recipes Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading recipes...</p>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery || mealTypeFilter !== 'all' ? 'No recipes found matching your filters.' : 'No recipes available yet. Be the first to share!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
