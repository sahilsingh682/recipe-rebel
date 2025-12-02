import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Eye, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  preparation_time: number;
  image_url: string | null;
  author_id: string;
  status: string;
  created_at: string;
  profiles: {
    name: string;
  };
}

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [pendingRecipes, setPendingRecipes] = useState<Recipe[]>([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, isAdmin]);

  const fetchData = async () => {
    try {
      // Fetch pending recipes
      const { data: pending, error: pendingError } = await supabase
        .from('recipes')
        .select(`
          *,
          profiles:author_id (name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (pendingError) throw pendingError;
      setPendingRecipes(pending || []);

      // Fetch stats
      const { data: allRecipes, error: statsError } = await supabase
        .from('recipes')
        .select('status');

      if (statsError) throw statsError;

      const statsData = {
        total: allRecipes?.length || 0,
        approved: allRecipes?.filter(r => r.status === 'approved').length || 0,
        pending: allRecipes?.filter(r => r.status === 'pending').length || 0,
        rejected: allRecipes?.filter(r => r.status === 'rejected').length || 0,
      };
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModerate = async (recipeId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('recipes')
        .update({ status })
        .eq('id', recipeId);

      if (error) throw error;

      toast.success(`Recipe ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
      fetchData();
    } catch (error) {
      console.error('Error moderating recipe:', error);
      toast.error('Failed to moderate recipe');
    }
  };

  if (!user || !isAdmin) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Moderate recipes and manage the platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Recipes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Recipes */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Recipes ({pendingRecipes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : pendingRecipes.length === 0 ? (
            <div className="text-center py-12">
              <Check className="h-12 w-12 mx-auto mb-4 text-secondary" />
              <p className="text-muted-foreground">No pending recipes. Great job!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRecipes.map((recipe) => (
                <Card key={recipe.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row gap-4 p-4">
                    {/* Image */}
                    <div className="w-full md:w-48 aspect-video rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {recipe.image_url ? (
                        <img
                          src={recipe.image_url}
                          alt={recipe.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-primary">
                          <span className="text-4xl">🍳</span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display font-semibold text-xl">{recipe.title}</h3>
                        <Badge variant="secondary">Pending</Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        By {recipe.profiles?.name || 'Anonymous Chef'}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{recipe.preparation_time} min</span>
                        </div>
                        <span>{recipe.ingredients.length} ingredients</span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {recipe.ingredients.slice(0, 5).map((ingredient, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {ingredient}
                          </Badge>
                        ))}
                        {recipe.ingredients.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{recipe.ingredients.length - 5} more
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/recipe/${recipe.id}`)}
                          variant="outline"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleModerate(recipe.id, 'approved')}
                          className="bg-secondary hover:bg-secondary/90"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleModerate(recipe.id, 'rejected')}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
