import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, User } from 'lucide-react';
import { toast } from 'sonner';

export default function RecipeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    if (id) {
      fetchRecipe();
      fetchComments();
      if (user) fetchUserRating();
    }
  }, [id, user]);

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
    if (!user || !newComment.trim()) return;

    const { error } = await supabase
      .from('comments')
      .insert({ recipe_id: id, user_id: user.id, text: newComment });

    if (!error) {
      setNewComment('');
      fetchComments();
      toast.success('Comment added!');
    }
  };

  if (!recipe) return <div className="container mx-auto px-4 py-8">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="shadow-card mb-6">
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
          
          <div className="flex items-center gap-4 text-muted-foreground">
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
              <span>{recipe.average_rating.toFixed(1)}</span>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Ingredients</h2>
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
