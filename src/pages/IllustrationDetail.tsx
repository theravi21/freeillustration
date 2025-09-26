import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Download, Eye, Calendar, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Illustration {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  topic?: string;
  orientation?: string;
  style?: string;
  dominant_color?: string;
  download_count: number;
  created_at: string;
  raw_file_path?: string;
  original_filename?: string;
  dimensions_width?: number;
  dimensions_height?: number;
  file_size?: number;
}

const IllustrationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [illustration, setIllustration] = useState<Illustration | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchIllustration(id);
    }
  }, [id]);

  const fetchIllustration = async (illustrationId: string) => {
    try {
      const { data, error } = await supabase
        .from('illustrations')
        .select('*')
        .eq('id', illustrationId)
        .eq('published', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching illustration:', error);
        toast({
          title: "Error",
          description: "Failed to load illustration.",
          variant: "destructive",
        });
        return;
      }

      if (!data) {
        toast({
          title: "Not Found",
          description: "Illustration not found or not published.",
          variant: "destructive",
        });
        return;
      }

      setIllustration(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load illustration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!illustration?.raw_file_path) {
      toast({
        title: "Error",
        description: "File not available for download.",
        variant: "destructive",
      });
      return;
    }

    setDownloading(true);
    try {
      // Get the file from storage
      const { data, error } = await supabase.storage
        .from('illustrations-processed')
        .download(illustration.raw_file_path);

      if (error) {
        throw error;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = illustration.original_filename || `illustration-${illustration.id}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Update download count using the database function
      const { error: updateError } = await supabase.rpc('increment_download_count', { 
        illustration_id: illustration.id 
      });

      if (updateError) {
        console.error('Failed to update download count:', updateError);
      }

      toast({
        title: "Success",
        description: "Download started successfully!",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: "Failed to download the file.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const getImageUrl = () => {
    if (!illustration?.raw_file_path) return null;
    
    const { data } = supabase.storage
      .from('illustrations-processed')
      .getPublicUrl(illustration.raw_file_path);
    
    return data.publicUrl;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
            <div className="aspect-square bg-muted rounded-lg mb-6"></div>
            <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-full mb-2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!illustration) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Illustration Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The illustration you're looking for doesn't exist or is not published.
          </p>
          <Button asChild>
            <Link to="/browse">Browse Illustrations</Link>
          </Button>
        </div>
      </div>
    );
  }

  const imageUrl = getImageUrl();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6 hover:scale-105 transition-transform duration-200">
          <Link to="/browse" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Browse
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="aspect-square bg-muted flex items-center justify-center">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={illustration.title}
                    className="w-full h-full object-contain"
                    style={{ maxHeight: '100%', maxWidth: '100%' }}
                  />
                ) : (
                  <div className="text-muted-foreground text-center p-8">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Preview not available</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 bg-primary hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-200 transform hover:shadow-lg hover:shadow-primary/25"
              >
                <Download className="h-4 w-4 mr-2" />
                {downloading ? 'Downloading...' : 'Download'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  const fullscreenUrl = imageUrl;
                  if (fullscreenUrl) {
                    window.open(fullscreenUrl, '_blank');
                  }
                }}
                className="hover:scale-105 active:scale-95 transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:shadow-lg"
              >
                <Eye className="h-4 w-4 mr-2" />
                Full View
              </Button>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{illustration.title}</h1>
              {illustration.description && (
                <p className="text-muted-foreground text-lg">{illustration.description}</p>
              )}
            </div>

            {/* Tags */}
            {illustration.tags && illustration.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {illustration.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Properties */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-medium mb-3">Properties</h3>
                
                {illustration.topic && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Topic:</span>
                    <Badge variant="outline">{illustration.topic}</Badge>
                  </div>
                )}
                
                {illustration.orientation && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Orientation:</span>
                    <Badge variant="outline">{illustration.orientation}</Badge>
                  </div>
                )}
                
                {illustration.style && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Style:</span>
                    <Badge variant="outline">{illustration.style}</Badge>
                  </div>
                )}
                
                {illustration.dominant_color && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Color:</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: illustration.dominant_color }}
                      />
                      <Badge variant="outline">{illustration.dominant_color}</Badge>
                    </div>
                  </div>
                )}
                
                {illustration.dimensions_width && illustration.dimensions_height && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Dimensions:</span>
                    <span className="text-sm">{illustration.dimensions_width} × {illustration.dimensions_height}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">File Size:</span>
                  <span className="text-sm">{formatFileSize(illustration.file_size)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Downloads:</span>
                  <span className="text-sm">{illustration.download_count}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Created:
                  </span>
                  <span className="text-sm">
                    {new Date(illustration.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IllustrationDetail;