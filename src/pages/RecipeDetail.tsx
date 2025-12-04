import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, User, Download, Pencil, Trash2, Flame, Beef, Wheat, Droplet } from 'lucide-react';
import { toast } from 'sonner';
import { commentSchema } from '@/lib/validations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRecipe();
      fetchComments();
      if (user) {
        fetchUserRating();
        checkAdminRole();
      }
    }
  }, [id, user]);

  const checkAdminRole = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    setIsAdmin(!!data);
  };

  const fetchRecipe = async () => {
    const { data } = await supabase
      .from('recipes')
      .select('*, profiles:author_id(name)')
      .eq('id', id)
      .single();
    setRecipe(data);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles:user_id(name)')
      .eq('recipe_id', id)
      .order('created_at', { ascending: false });
    setComments(data || []);
  };

  const fetchUserRating = async () => {
    const { data } = await supabase
      .from('ratings')
      .select('rating')
      .eq('recipe_id', id)
      .eq('user_id', user?.id)
      .maybeSingle();
    if (data) setUserRating(data.rating);
  };

  const handleRate = async (rating: number) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('ratings')
      .upsert({ recipe_id: id, user_id: user.id, rating });

    if (!error) {
      setUserRating(rating);
      toast.success('Rating saved!');
      fetchRecipe();
    }
  };

  const handleComment = async () => {
    if (!user) return;

    const validationResult = commentSchema.safeParse({ text: newComment });
    if (!validationResult.success) {
      toast.error(validationResult.error.errors[0].message);
      return;
    }

    const { error } = await supabase
      .from('comments')
      .insert({ recipe_id: id, user_id: user.id, text: validationResult.data.text });

    if (!error) {
      setNewComment('');
      fetchComments();
      toast.success('Comment added!');
    }
  };

  const handleDownloadIngredients = () => {
    if (!recipe) return;
    
    const content = `Ingredients for: ${recipe.title}\n\n${recipe.ingredients.map((ing: string, idx: number) => `${idx + 1}. ${ing}`).join('\n')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recipe.title.replace(/[^a-z0-9]/gi, '_')}_ingredients.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Ingredients downloaded!');
  };

  const handleDelete = async () => {
    if (!recipe) return;
    
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipe.id);

    if (!error) {
      toast.success('Recipe deleted successfully');
      navigate('/');
    } else {
      toast.error('Failed to delete recipe');
    }
  };

  const canEditDelete = user && (user.id === recipe?.author_id || isAdmin);

  if (!recipe) return <div className="container mx-auto px-4 py-8">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="shadow-card mb-6 relative">
        {/* Edit/Delete Icons */}
        {canEditDelete && (
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => navigate(`/recipe/${id}/edit`)}
              className="bg-background/80 backdrop-blur-sm"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  className="bg-destructive/80 backdrop-blur-sm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this recipe? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          {recipe.image_url ? (
            <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
              <span className="text-8xl">🍳</span>
            </div>
          )}
        </div>
        <CardContent className="p-6 space-y-4">
          <h1 className="text-4xl font-display font-bold">{recipe.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{recipe.profiles?.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{recipe.preparation_time} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span>{recipe.average_rating?.toFixed(1) || '0.0'}</span>
            </div>
            {recipe.meal_type && (
              <Badge variant="outline" className="capitalize">{recipe.meal_type}</Badge>
            )}
          </div>

          {/* Nutrition Info */}
          {(recipe.calories || recipe.protein || recipe.carbs || recipe.fat) && (
            <div className="bg-secondary/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Nutrition Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recipe.calories && (
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Calories</p>
                      <p className="font-semibold">{recipe.calories} kcal</p>
                    </div>
                  </div>
                )}
                {recipe.protein && (
                  <div className="flex items-center gap-2">
                    <Beef className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Protein</p>
                      <p className="font-semibold">{recipe.protein}g</p>
                    </div>
                  </div>
                )}
                {recipe.carbs && (
                  <div className="flex items-center gap-2">
                    <Wheat className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Carbs</p>
                      <p className="font-semibold">{recipe.carbs}g</p>
                    </div>
                  </div>
                )}
                {recipe.fat && (
                  <div className="flex items-center gap-2">
                    <Droplet className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fat</p>
                      <p className="font-semibold">{recipe.fat}g</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">Ingredients</h2>
              <Button variant="outline" size="sm" onClick={handleDownloadIngredients}>
                <Download className="h-4 w-4 mr-2" />
                Download List
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recipe.ingredients.map((ing: string, idx: number) => (
                <Badge key={idx} variant="secondary">{ing}</Badge>
              ))}
            </div>
          </div>

          {user && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Rate this recipe</h3>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Star
                    key={rating}
                    className={`h-6 w-6 cursor-pointer transition-smooth ${
                      (hoverRating || userRating) >= rating
                        ? 'fill-accent text-accent'
                        : 'text-muted-foreground'
                    }`}
                    onMouseEnter={() => setHoverRating(rating)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => handleRate(rating)}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-2xl font-display font-bold">Comments</h2>
          
          {user && (
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <Button onClick={handleComment}>Post</Button>
            </div>
          )}

          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border-l-2 border-primary pl-4">
                <p className="font-semibold text-sm">{comment.profiles?.name}</p>
                <p className="text-sm text-muted-foreground">{comment.text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
