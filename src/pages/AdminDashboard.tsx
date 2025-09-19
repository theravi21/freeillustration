import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Illustration {
  id: string;
  title: string;
  creator_id: string;
  published: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  file_path: string;
}

const AdminDashboard = () => {
  const [drafts, setDrafts] = useState<Illustration[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDrafts = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('illustrations')
      .select('*')
      .eq('published', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching drafts:', error);
      toast({
        title: "Error",
        description: "Failed to load draft illustrations",
        variant: "destructive"
      });
    } else {
      setDrafts(data || []);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handlePublish = async (illustration: Illustration) => {
    const { error } = await supabase
      .from('illustrations')
      .update({ 
        published: true, 
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', illustration.id);

    if (error) {
      console.error('Error publishing illustration:', error);
      toast({
        title: "Error", 
        description: "Failed to publish illustration",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: `"${illustration.title}" has been published!`
      });
      
      // Remove from drafts list
      setDrafts(prev => prev.filter(d => d.id !== illustration.id));
    }
  };

  const getPreviewUrl = (illustration: Illustration) => {
    const { data: { publicUrl } } = supabase.storage
      .from('illustrations-raw')
      .getPublicUrl(illustration.file_path);
    
    return `${publicUrl}?v=${new Date(illustration.updated_at).getTime()}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Review and publish pending illustrations
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Pending Approval ({drafts.length})
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-0">
                  <div className="aspect-video bg-muted rounded-t-lg" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : drafts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drafts.map((illustration) => (
              <Card key={illustration.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <img
                      src={getPreviewUrl(illustration)}
                      alt={illustration.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm line-clamp-1">
                        {illustration.title}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {illustration.status}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-3">
                      Uploaded {new Date(illustration.created_at).toLocaleDateString()}
                    </p>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handlePublish(illustration)}
                        className="flex-1 gap-1"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Publish
                      </Button>
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(getPreviewUrl(illustration), '_blank')}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">All caught up!</h3>
              <p className="text-muted-foreground">
                No illustrations pending approval at the moment.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;