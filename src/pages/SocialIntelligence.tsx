import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, TrendingUp, Sparkles, Target, Globe, BarChart3, Smile, Frown, Meh } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SocialIntelligence() {
  // Fetch sentiment data
  const { data: sentimentData, isLoading } = useQuery({
    queryKey: ['sentiment-analysis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sentiment_analysis')
        .select('*')
        .order('analyzed_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate statistics
  const stats = sentimentData?.reduce(
    (acc, item) => {
      acc[item.sentiment]++;
      acc.total++;
      acc.avgScore += item.sentiment_score;
      return acc;
    },
    { positive: 0, negative: 0, neutral: 0, mixed: 0, total: 0, avgScore: 0 }
  );

  const avgSentimentScore = stats ? (stats.avgScore / stats.total).toFixed(2) : '0';
  const total = stats?.total || 0;

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <Smile className="h-5 w-5 text-green-500" />;
      case 'negative':
        return <Frown className="h-5 w-5 text-red-500" />;
      case 'neutral':
        return <Meh className="h-5 w-5 text-gray-500" />;
      default:
        return <Meh className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-50';
      case 'negative':
        return 'text-red-600 bg-red-50';
      case 'neutral':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-indigo-500/5 to-purple-500/5 animate-in fade-in-50 duration-700">
      <div className="container mx-auto p-6 space-y-6">
        {/* Enhanced Header */}
        <div className="backdrop-blur-sm bg-card/80 p-8 rounded-2xl border-2 border-primary/20 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Social Intelligence Hub
              </h1>
              <p className="text-muted-foreground mt-2 text-lg flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI-powered sentiment analysis • Real-time insights • Predictive analytics
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="backdrop-blur-sm bg-card/95 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Positive Sentiment</CardTitle>
              <div className="p-2 rounded-lg bg-green-500/10">
                <Smile className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.positive || 0}</div>
              <Progress value={total > 0 ? (stats!.positive / total) * 100 : 0} className="mt-2 h-2 bg-green-100" />
              <p className="text-xs text-muted-foreground mt-2">
                {total > 0 ? ((stats!.positive / total) * 100).toFixed(1) : 0}% of total • Trending up
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-card/95 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Negative Sentiment</CardTitle>
              <div className="p-2 rounded-lg bg-red-500/10">
                <Frown className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats?.negative || 0}</div>
              <Progress value={total > 0 ? (stats!.negative / total) * 100 : 0} className="mt-2 h-2 bg-red-100" />
              <p className="text-xs text-muted-foreground mt-2">
                {total > 0 ? ((stats!.negative / total) * 100).toFixed(1) : 0}% of total • Needs attention
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-card/95 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Neutral Sentiment</CardTitle>
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Meh className="h-5 w-5 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats?.neutral || 0}</div>
              <Progress value={total > 0 ? (stats!.neutral / total) * 100 : 0} className="mt-2 h-2 bg-yellow-100" />
              <p className="text-xs text-muted-foreground mt-2">
                {total > 0 ? ((stats!.neutral / total) * 100).toFixed(1) : 0}% of total • Stable
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-card/95 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">AI Confidence Score</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{avgSentimentScore}</div>
              <Progress value={parseFloat(avgSentimentScore) * 50 + 50} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Range: -1 to +1 • Real-time analysis
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analysis List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Analysis</CardTitle>
            <CardDescription>
              Latest sentiment analysis from your social media
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="positive">Positive</TabsTrigger>
                <TabsTrigger value="negative">Negative</TabsTrigger>
                <TabsTrigger value="neutral">Neutral</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-3 mt-4">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading analysis...
                  </div>
                ) : sentimentData && sentimentData.length > 0 ? (
                  <div className="space-y-3">
                    {sentimentData.map((item) => (
                      <div key={item.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getSentimentIcon(item.sentiment)}
                              <Badge variant="outline" className={getSentimentColor(item.sentiment)}>
                                {item.sentiment}
                              </Badge>
                              <Badge variant="secondary">{item.platform}</Badge>
                              <span className="text-sm text-muted-foreground">
                                Score: {item.sentiment_score.toFixed(2)}
                              </span>
                            </div>
                            
                            <p className="text-sm mb-2">{item.content_text}</p>
                            
                            {item.topics && item.topics.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                <span className="text-xs text-muted-foreground">Topics:</span>
                                {item.topics.map((topic: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {item.keywords && item.keywords.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className="text-xs text-muted-foreground">Keywords:</span>
                                {item.keywords.slice(0, 5).map((keyword: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            <p className="text-xs text-muted-foreground mt-2">
                              Analyzed {new Date(item.analyzed_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No sentiment data yet</p>
                    <p className="text-sm mt-1">Start analyzing your social content</p>
                  </div>
                )}
              </TabsContent>

              {['positive', 'negative', 'neutral'].map((filter) => (
                <TabsContent key={filter} value={filter} className="space-y-3 mt-4">
                  <div className="space-y-3">
                    {sentimentData
                      ?.filter((item) => item.sentiment === filter)
                      .map((item) => (
                        <div key={item.id} className="p-4 border rounded-lg">
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getSentimentIcon(item.sentiment)}
                                <Badge variant="secondary">{item.platform}</Badge>
                                <span className="text-sm text-muted-foreground">
                                  Score: {item.sentiment_score.toFixed(2)}
                                </span>
                              </div>
                              <p className="text-sm">{item.content_text}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}