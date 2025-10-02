import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowLeft, Building2, Home, DollarSign, Landmark, Heart, GraduationCap, Briefcase, Scale, Users, HandHeart } from "lucide-react";
import { Loader2 } from "lucide-react";

const iconMap: Record<string, any> = {
  Building2,
  Home,
  DollarSign,
  Landmark,
  Heart,
  GraduationCap,
  Briefcase,
  Scale,
  Users,
  HandHeart,
};

const Industry = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: industry, isLoading } = useQuery({
    queryKey: ['industry', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('industries')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Industry not found');
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!industry) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Industry not found</h1>
          <Button onClick={() => navigate('/')}>Go back home</Button>
        </div>
      </div>
    );
  }

  const Icon = iconMap[industry.icon_name] || Building2;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-white sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Icon className="h-8 w-8 text-accent" />
              <span className="text-xl font-bold text-foreground">{industry.display_name}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Log in
            </Button>
            <Button onClick={() => navigate("/auth")}>
              Start your free trial
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-accent/5 to-white">
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-accent/10 text-accent mb-4">
              <Icon className="h-5 w-5" />
              <span className="text-sm font-semibold">{industry.display_name} Solutions</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
              Social Media Management Built for {industry.display_name}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {industry.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
              <Button size="lg" onClick={() => navigate("/auth")} className="text-base px-8">
                Start your free trial
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
                Request a demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      {industry.features && Array.isArray(industry.features) && industry.features.length > 0 && (
        <div className="bg-white py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                  Features Designed for {industry.display_name}
                </h2>
                <p className="text-lg text-muted-foreground">
                  Everything you need to succeed on social media
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(industry.features as string[]).map((feature: string, index: number) => (
                  <div
                    key={index}
                    className="p-6 rounded-xl border border-border hover:border-accent transition-all hover:shadow-lg"
                  >
                    <CheckCircle2 className="h-8 w-8 text-accent mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-foreground">{feature}</h3>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Use Cases Section */}
      {industry.use_cases && Array.isArray(industry.use_cases) && industry.use_cases.length > 0 && (
        <div className="bg-secondary/30 py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                  How {industry.display_name} Use SocialHub
                </h2>
                <p className="text-lg text-muted-foreground">
                  Real-world applications for your organization
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {(industry.use_cases as string[]).map((useCase: string, index: number) => (
                  <div
                    key={index}
                    className="bg-white p-8 rounded-xl shadow-sm border border-border"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                        <span className="text-accent font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-foreground">{useCase}</h3>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Benefits Section */}
      {industry.benefits && Array.isArray(industry.benefits) && industry.benefits.length > 0 && (
        <div className="bg-white py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                  Benefits for {industry.display_name}
                </h2>
                <p className="text-lg text-muted-foreground">
                  See the impact on your organization
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(industry.benefits as string[]).map((benefit: string, index: number) => (
                  <div
                    key={index}
                    className="text-center p-6 rounded-xl bg-gradient-to-b from-accent/5 to-white border border-accent/20"
                  >
                    <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                      ✓
                    </div>
                    <p className="font-semibold text-foreground">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-accent to-primary py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center text-white space-y-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Ready to transform your {industry.display_name} social media?
            </h2>
            <p className="text-xl opacity-90">
              Join organizations like yours using SocialHub to engage their audience
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate("/auth")} 
                className="text-base px-8"
              >
                Start your free trial
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/auth")}
                className="text-white border-white hover:bg-white/10"
              >
                Contact sales
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-12">
        <div className="container mx-auto px-6">
          <div className="text-center text-muted-foreground">
            <p>© 2025 SocialHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Industry;