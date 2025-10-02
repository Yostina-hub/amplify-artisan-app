import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save } from "lucide-react";

interface LandingContent {
  id: string;
  section_key: string;
  content: any;
  is_active: boolean;
}

const LandingPageManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heroContent, setHeroContent] = useState<any>({});
  const [professionalPricing, setProfessionalPricing] = useState<any>({});
  const [teamPricing, setTeamPricing] = useState<any>({});
  const [businessPricing, setBusinessPricing] = useState<any>({});

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_page_content')
        .select('*')
        .in('section_key', ['hero', 'pricing_professional', 'pricing_team', 'pricing_business']);

      if (error) throw error;

      data?.forEach((item) => {
        switch (item.section_key) {
          case 'hero':
            setHeroContent(item.content);
            break;
          case 'pricing_professional':
            setProfessionalPricing(item.content);
            break;
          case 'pricing_team':
            setTeamPricing(item.content);
            break;
          case 'pricing_business':
            setBusinessPricing(item.content);
            break;
        }
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading content",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSection = async (sectionKey: string, content: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('landing_page_content')
        .update({ content })
        .eq('section_key', sectionKey);

      if (error) throw error;

      toast({
        title: "Saved successfully",
        description: `${sectionKey} section has been updated`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error saving",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Landing Page Manager</h1>
        <p className="text-muted-foreground">Manage content for the public landing page</p>
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList>
          <TabsTrigger value="hero">Hero Section</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Plans</TabsTrigger>
        </TabsList>

        {/* Hero Section */}
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
              <CardDescription>Edit the main hero section content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hero-title">Title</Label>
                <Input
                  id="hero-title"
                  value={heroContent.title || ''}
                  onChange={(e) => setHeroContent({ ...heroContent, title: e.target.value })}
                  placeholder="Drive real business impact with"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero-highlight">Title Highlight (colored text)</Label>
                <Input
                  id="hero-highlight"
                  value={heroContent.titleHighlight || ''}
                  onChange={(e) => setHeroContent({ ...heroContent, titleHighlight: e.target.value })}
                  placeholder="real-time social insights."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero-subtitle">Subtitle</Label>
                <Input
                  id="hero-subtitle"
                  value={heroContent.subtitle || ''}
                  onChange={(e) => setHeroContent({ ...heroContent, subtitle: e.target.value })}
                  placeholder="SocialHub makes it easy."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero-description">Description</Label>
                <Textarea
                  id="hero-description"
                  value={heroContent.description || ''}
                  onChange={(e) => setHeroContent({ ...heroContent, description: e.target.value })}
                  placeholder="Manage all your social media channels..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cta-primary">Primary CTA Button</Label>
                  <Input
                    id="cta-primary"
                    value={heroContent.ctaPrimary || ''}
                    onChange={(e) => setHeroContent({ ...heroContent, ctaPrimary: e.target.value })}
                    placeholder="Start your free trial"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cta-secondary">Secondary CTA Button</Label>
                  <Input
                    id="cta-secondary"
                    value={heroContent.ctaSecondary || ''}
                    onChange={(e) => setHeroContent({ ...heroContent, ctaSecondary: e.target.value })}
                    placeholder="Request a demo"
                  />
                </div>
              </div>
              <Button onClick={() => handleSaveSection('hero', heroContent)} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Hero Section
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Section */}
        <TabsContent value="pricing" className="space-y-6">
          {/* Professional Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plan Name</Label>
                  <Input
                    value={professionalPricing.name || ''}
                    onChange={(e) => setProfessionalPricing({ ...professionalPricing, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price ($/month)</Label>
                  <Input
                    type="number"
                    value={professionalPricing.price || ''}
                    onChange={(e) => setProfessionalPricing({ ...professionalPricing, price: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={professionalPricing.description || ''}
                  onChange={(e) => setProfessionalPricing({ ...professionalPricing, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Features (one per line)</Label>
                <Textarea
                  value={professionalPricing.features?.join('\n') || ''}
                  onChange={(e) => setProfessionalPricing({ 
                    ...professionalPricing, 
                    features: e.target.value.split('\n').filter(f => f.trim()) 
                  })}
                  rows={4}
                />
              </div>
              <Button onClick={() => handleSaveSection('pricing_professional', professionalPricing)} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Professional Plan
              </Button>
            </CardContent>
          </Card>

          {/* Team Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Team Plan (Featured)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plan Name</Label>
                  <Input
                    value={teamPricing.name || ''}
                    onChange={(e) => setTeamPricing({ ...teamPricing, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price ($/month)</Label>
                  <Input
                    type="number"
                    value={teamPricing.price || ''}
                    onChange={(e) => setTeamPricing({ ...teamPricing, price: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={teamPricing.description || ''}
                  onChange={(e) => setTeamPricing({ ...teamPricing, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Features (one per line)</Label>
                <Textarea
                  value={teamPricing.features?.join('\n') || ''}
                  onChange={(e) => setTeamPricing({ 
                    ...teamPricing, 
                    features: e.target.value.split('\n').filter(f => f.trim()) 
                  })}
                  rows={5}
                />
              </div>
              <Button onClick={() => handleSaveSection('pricing_team', teamPricing)} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Team Plan
              </Button>
            </CardContent>
          </Card>

          {/* Business Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Business Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plan Name</Label>
                  <Input
                    value={businessPricing.name || ''}
                    onChange={(e) => setBusinessPricing({ ...businessPricing, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price ($/month)</Label>
                  <Input
                    type="number"
                    value={businessPricing.price || ''}
                    onChange={(e) => setBusinessPricing({ ...businessPricing, price: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={businessPricing.description || ''}
                  onChange={(e) => setBusinessPricing({ ...businessPricing, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Features (one per line)</Label>
                <Textarea
                  value={businessPricing.features?.join('\n') || ''}
                  onChange={(e) => setBusinessPricing({ 
                    ...businessPricing, 
                    features: e.target.value.split('\n').filter(f => f.trim()) 
                  })}
                  rows={5}
                />
              </div>
              <Button onClick={() => handleSaveSection('pricing_business', businessPricing)} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Business Plan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LandingPageManager;
