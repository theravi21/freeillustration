import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Upload, Search, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import IllustrationGrid from '@/components/IllustrationGrid';

const Index = () => {
  const [recentIllustrations, setRecentIllustrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentIllustrations = async () => {
      try {
        const { data, error } = await supabase
          .from('illustrations')
          .select('*')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(6);

        if (error) throw error;
        setRecentIllustrations(data || []);
      } catch (error) {
        console.error('Error fetching recent illustrations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentIllustrations();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20 animate-fade-in">
          <div className="inline-block mb-6 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-semibold animate-scale-in">
            ✨ Free & Beautiful Illustrations
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-primary bg-clip-text text-transparent leading-tight">
            Discover Amazing
            <br />
            Illustrations
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Browse thousands of high-quality, free illustrations for your creative projects. 
            Join our community and share your artwork with the world.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-up">
            <Button asChild size="lg" variant="premium" className="text-base">
              <Link to="/browse">
                <Search className="mr-2 h-5 w-5" />
                Browse Gallery
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base">
              <Link to="/upload">
                <Upload className="mr-2 h-5 w-5" />
                Upload Your Art
              </Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="text-center p-6 rounded-xl bg-card shadow-card hover:shadow-elegant transition-all duration-300 hover:scale-105 animate-slide-in">
            <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow">
              <Image className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3">High Quality</h3>
            <p className="text-muted-foreground leading-relaxed">
              Premium illustrations optimized for web, mobile, and print projects.
            </p>
          </div>
          
          <div className="text-center p-6 rounded-xl bg-card shadow-card hover:shadow-elegant transition-all duration-300 hover:scale-105 animate-slide-in" style={{ animationDelay: '0.1s' }}>
            <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow">
              <Search className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3">Smart Search</h3>
            <p className="text-muted-foreground leading-relaxed">
              Powerful filters and AI-powered search to find exactly what you need.
            </p>
          </div>
          
          <div className="text-center p-6 rounded-xl bg-card shadow-card hover:shadow-elegant transition-all duration-300 hover:scale-105 animate-slide-in" style={{ animationDelay: '0.2s' }}>
            <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow">
              <Upload className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3">Instant Upload</h3>
            <p className="text-muted-foreground leading-relaxed">
              Share your artwork instantly and reach thousands of designers worldwide.
            </p>
          </div>
        </div>

        {/* Recent Illustrations */}
        {recentIllustrations.length > 0 && (
          <div className="mb-20 animate-fade-in">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Latest Creations</h2>
              <p className="text-lg text-muted-foreground">
                Fresh illustrations from our talented community
              </p>
            </div>
            <IllustrationGrid illustrations={recentIllustrations} />
            <div className="text-center mt-10">
              <Button asChild variant="outline" size="lg">
                <Link to="/browse">
                  Explore Full Gallery
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Auth CTA */}
        <div className="relative overflow-hidden text-center bg-gradient-hero rounded-2xl p-12 shadow-elegant border border-primary/20">
          <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Join Our Creative Community</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Upload your illustrations, discover amazing artwork, and connect with designers worldwide.
            </p>
            <Button asChild size="lg" variant="premium">
              <Link to="/auth">
                Get Started Free →
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
