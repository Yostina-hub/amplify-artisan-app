import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdCampaign {
  id: string;
  name: string;
  platform: string;
  budget: number;
  target_audience?: any;
}

interface PersonalizedAdsProps {
  maxAds?: number;
  className?: string;
}

export function PersonalizedAds({ maxAds = 3, className = '' }: PersonalizedAdsProps) {
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedAds, setDismissedAds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchRecommendedAds();
  }, []);

  const fetchRecommendedAds = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('recommend-ads', {
        body: { limit: maxAds }
      });

      if (error) throw error;

      setAds(data.recommendations || []);
    } catch (error: any) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackImpression = async (ad: AdCampaign, type: 'view' | 'click' | 'dismiss') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sessionId = sessionStorage.getItem('engagement_session_id') || 'unknown';

      await supabase.from('ad_impressions').insert({
        user_id: user.id,
        ad_campaign_id: ad.id,
        company_id: null, // Would be set if you track company_id in campaigns
        impression_type: type,
        session_id: sessionId,
        engagement_score: type === 'click' ? 10 : type === 'dismiss' ? -5 : 1,
      });

      // Calculate reach score after interaction
      if (type === 'click') {
        await supabase.functions.invoke('calculate-reach-score', {
          body: { userId: user.id }
        });
      }
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  };

  const handleAdClick = async (ad: AdCampaign) => {
    await trackImpression(ad, 'click');
    toast({
      title: 'Opening campaign',
      description: `Redirecting to ${ad.name}...`,
    });
  };

  const handleAdDismiss = async (ad: AdCampaign) => {
    await trackImpression(ad, 'dismiss');
    setDismissedAds(prev => new Set(prev).add(ad.id));
    
    // Fetch a new ad to replace the dismissed one
    setTimeout(() => {
      fetchRecommendedAds();
    }, 500);
  };

  useEffect(() => {
    // Track views for all visible ads
    ads.forEach(ad => {
      if (!dismissedAds.has(ad.id)) {
        trackImpression(ad, 'view');
      }
    });
  }, [ads]);

  const visibleAds = ads.filter(ad => !dismissedAds.has(ad.id));

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(maxAds)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-24 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (visibleAds.length === 0) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">Recommended for you</h3>
        <span className="text-xs text-muted-foreground">Sponsored</span>
      </div>
      
      {visibleAds.map((ad) => (
        <Card key={ad.id} className="relative hover:shadow-lg transition-shadow">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 rounded-full"
            onClick={() => handleAdDismiss(ad)}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <CardContent className="p-4 cursor-pointer" onClick={() => handleAdClick(ad)}>
            <div className="space-y-2">
              <div className="flex items-start justify-between pr-8">
                <h4 className="font-semibold">{ad.name}</h4>
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2">
                {ad.target_audience?.description || 'Discover amazing products and services tailored for you'}
              </p>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                  {ad.platform}
                </span>
                <ExternalLink className="h-3 w-3" />
                <span>Learn more</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
