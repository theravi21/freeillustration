import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminPublishButton from '@/components/AdminPublishButton';
import { formatDistanceToNow } from 'date-fns';

interface Illustration {
  id: string;
  title: string;
  creator_id: string;
  created_at: string;
  published: boolean;
  status: string;
  file_path: string;
  updated_at: string;
}

const AdminDashboard = () => {
  const [drafts, setDrafts] = useState<Illustration[]>([]);
  const [published, setPublished] = useState<Illustration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIllustrations = async () => {
    setLoading(true);
    
    try {
      // Fetch drafts
      const { data: draftData, error: draftError } = await supabase
        .from('illustrations')
        .select('*')
        .eq('published', false)
        .order('created_at', { ascending: false });

      // Fetch published
      const { data: publishedData, error: publishedError } = await supabase
        .from('illustrations')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (draftError) throw draftError;
      if (publishedError) throw publishedError;

      setDrafts(draftData || []);
      setPublished(publishedData || []);
    } catch (error) {
      console.error('Error fetching illustrations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIllustrations();
  }, []);

  const handlePublishChange = (id: string, isPublished: boolean) => {
    if (isPublished) {
      // Move from drafts to published
      const illustration = drafts.find(item => item.id === id);
      if (illustration) {
        setDrafts(prev => prev.filter(item => item.id !== id));
        setPublished(prev => [...prev, { ...illustration, published: true }]);
      }
    } else {
      // Move from published to drafts
      const illustration = published.find(item => item.id === id);
      if (illustration) {
        setPublished(prev => prev.filter(item => item.id !== id));
        setDrafts(prev => [...prev, { ...illustration, published: false }]);
      }
    }
  };

  const getImageUrl = (illustration: Illustration) => {
    const { data } = supabase.storage
      .from('illustrations-raw')
      .getPublicUrl(illustration.file_path);
    return `${data.publicUrl}?v=${new Date(illustration.updated_at).getTime()}`;
  };

  const IllustrationCard = ({ illustration, isPublished }: { 
    illustration: Illustration; 
    isPublished: boolean;
  }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <img 
              src={getImageUrl(illustration)}
              alt={illustration.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate mb-1">{illustration.title}</h3>
            <p className="text-xs text-muted-foreground mb-2">
              Created {formatDistanceToNow(new Date(illustration.created_at), { addSuffix: true })}
            </p>
            <div className="flex items-center justify-between">
              <Badge variant={isPublished ? "default" : "secondary"}>
                {isPublished ? "Published" : "Draft"}
              </Badge>
              <AdminPublishButton
                illustrationId={illustration.id}
                isPublished={isPublished}
                onPublishChange={handlePublishChange}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage illustration publications and moderate content
          </p>
        </div>

        <Tabs defaultValue="drafts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="drafts">
              Drafts ({drafts.length})
            </TabsTrigger>
            <TabsTrigger value="published">
              Published ({published.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="drafts" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Draft Illustrations</h2>
              <p className="text-muted-foreground text-sm">
                These illustrations are not visible on the public homepage
              </p>
            </div>
            
            {drafts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No drafts found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {drafts.map((illustration) => (
                  <IllustrationCard
                    key={illustration.id}
                    illustration={illustration}
                    isPublished={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="published" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Published Illustrations</h2>
              <p className="text-muted-foreground text-sm">
                These illustrations are visible on the public homepage
              </p>
            </div>
            
            {published.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No published illustrations found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {published.map((illustration) => (
                  <IllustrationCard
                    key={illustration.id}
                    illustration={illustration}
                    isPublished={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;