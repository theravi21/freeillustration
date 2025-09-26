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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6">
            Free <span className="text-primary">Illustrations</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover thousands of high-quality, free illustrations for your projects. 
            Upload, browse, and download beautiful artwork from our creative community.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link to="/browse">
                <Search className="mr-2 h-5 w-5" />
                Browse Illustrations
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link to="/upload">
                <Upload className="mr-2 h-5 w-5" />
                Upload Your Art
              </Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Image className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">High Quality</h3>
            <p className="text-muted-foreground">
              All illustrations are carefully curated and optimized for various use cases.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Easy Search</h3>
            <p className="text-muted-foreground">
              Find exactly what you need with powerful search and filtering options.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Free Upload</h3>
            <p className="text-muted-foreground">
              Share your creativity with the world and help build our community library.
            </p>
          </div>
        </div>

        {/* Recent Illustrations */}
        {recentIllustrations.length > 0 && (
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Recent Uploads</h2>
              <p className="text-muted-foreground">
                Check out the latest illustrations from our community
              </p>
            </div>
            <IllustrationGrid illustrations={recentIllustrations} />
            <div className="text-center mt-8">
              <Button asChild variant="outline" size="lg">
                <Link to="/browse">
                  View All Illustrations
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Auth CTA */}
        <div className="text-center bg-muted/50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-6">
            Create an account to upload illustrations and access premium features.
          </p>
          <Button asChild size="lg">
            <Link to="/auth">
              Get Started Free
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
