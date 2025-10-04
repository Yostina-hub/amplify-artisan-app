import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEngagementTracker } from "@/hooks/useEngagementTracker";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, ThumbsUp, MessageCircle, Share2, Eye, RefreshCw } from "lucide-react";

export const RecommendedContentFeed = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { trackInteraction } = useEngagementTracker();
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  const { data: recommendations, isLoading, refetch } = useQuery({
    queryKey: ['content-recommendations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_recommendations')
        .select(`
          *,
          social_media_posts (
            id,
            content,
            platforms,
            created_at,
            likes,
            shares,
            views
          )
        `)
        .eq('user_id', user?.id)
        .eq('is_viewed', false)
        .gte('expires_at', new Date().toISOString())
        .order('recommendation_score', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const generateRecommendationsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('generate-recommendations', {
        body: { userId: user?.id, limit: 10 }
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-recommendations'] });
      toast.success("New recommendations generated!");
    },
    onError: (error) => {
      console.error('Error generating recommendations:', error);
      toast.error("Failed to generate recommendations");
    },
  });

  const markAsViewedMutation = useMutation({
    mutationFn: async (recommendationId: string) => {
      const { error } = await supabase
        .from('content_recommendations')
        .update({ is_viewed: true })
        .eq('id', recommendationId);
      
      if (error) throw error;
    },
  });

  const handleInteraction = (
    type: 'like' | 'comment' | 'share',
    postId: string,
    recommendationId: string
  ) => {
    trackInteraction(type, postId);
    
    // Mark recommendation as interacted
    supabase
      .from('content_recommendations')
      .update({ is_interacted: true })
      .eq('id', recommendationId)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['content-recommendations'] });
      });
    
    toast.success(`Content ${type}d!`);
  };

  const toggleExpanded = (postId: string, recommendationId: string) => {
    const newExpanded = new Set(expandedPosts);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
      markAsViewedMutation.mutate(recommendationId);
    }
    setExpandedPosts(newExpanded);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Recommended For You</h2>
        </div>
        <Button
          onClick={() => generateRecommendationsMutation.mutate()}
          disabled={generateRecommendationsMutation.isPending}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${generateRecommendationsMutation.isPending ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading recommendations...</p>
        </div>
      ) : !recommendations || recommendations.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              No recommendations available yet. Interact with more content to get personalized recommendations!
            </p>
            <Button onClick={() => generateRecommendationsMutation.mutate()}>
              Generate Recommendations
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((rec: any) => {
            const post = rec.social_media_posts;
            const isExpanded = expandedPosts.has(post.id);
            
            return (
              <Card key={rec.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2">
                      {post.content?.substring(0, 100)}...
                    </CardTitle>
                    <Badge variant="secondary" className="ml-2">
                      {Math.round(rec.recommendation_score)}%
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {rec.recommendation_reason}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex gap-2 flex-wrap">
                      {post.platforms?.map((platform: string) => (
                        <Badge key={platform} variant="outline" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                    
                    {isExpanded && (
                      <p className="text-sm mt-4">{post.content}</p>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(post.id, rec.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {isExpanded ? 'Collapse' : 'View'}
                  </Button>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInteraction('like', post.id, rec.id)}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInteraction('comment', post.id, rec.id)}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInteraction('share', post.id, rec.id)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
