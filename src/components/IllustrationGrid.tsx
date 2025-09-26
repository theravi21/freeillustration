import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Illustration {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  topic?: string;
  orientation?: string;
  style?: string;
  dominant_color?: string;
  thumbnail_path?: string;
  png_small_path?: string;
  download_count: number;
  created_at: string;
  updated_at: string;
  viewUrl?: string;
  raw_file_path?: string;
}

interface IllustrationGridProps {
  illustrations: Illustration[];
}

const IllustrationGrid: React.FC<IllustrationGridProps> = ({ illustrations }) => {
  const handleDownload = async (illustration: Illustration, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!illustration.raw_file_path) {
      console.error('No file path available for download');
      return;
    }

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
      a.download = `illustration-${illustration.id}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Update download count
      await supabase.rpc('increment_download_count', { 
        illustration_id: illustration.id 
      });
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const formatDownloadCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {illustrations.map((illustration) => (
        <Link
          key={illustration.id}
          to={`/illustration/${illustration.id}`}
          className="group block"
        >
          <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <div className="relative aspect-square">
              {/* Illustration Image */}
              <div className="w-full h-full bg-muted rounded-t-lg flex items-center justify-center">
                {(() => {
                  // Create the image URL from file_path using Supabase storage
                  let imageUrl = null;
                  
                  if (illustration.thumbnail_path) {
                    // Use thumbnail if available
                    imageUrl = supabase.storage.from('illustrations-processed').getPublicUrl(illustration.thumbnail_path).data.publicUrl;
                  } else if (illustration.png_small_path) {
                    // Use small PNG if available
                    imageUrl = supabase.storage.from('illustrations-processed').getPublicUrl(illustration.png_small_path).data.publicUrl;
                  } else if (illustration.raw_file_path) {
                    // Use raw file path in processed bucket
                    const fileName = illustration.raw_file_path.split('/').pop();
                    const userFolder = illustration.raw_file_path.split('/')[1];
                    imageUrl = supabase.storage.from('illustrations-processed').getPublicUrl(`${userFolder}/${fileName}`).data.publicUrl;
                  }
                  
                  // Add cache busting parameter using updated_at timestamp
                  if (imageUrl && illustration.updated_at) {
                    const separator = imageUrl.includes('?') ? '&' : '?';
                    const timestamp = new Date(illustration.updated_at).getTime();
                    imageUrl = `${imageUrl}${separator}v=${timestamp}`;
                  }
                  
                  return imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={illustration.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        // Fallback to showing just the title if image fails to load
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.fallback-text') as HTMLElement;
                        if (fallback) fallback.style.display = 'block';
                      }}
                    />
                  ) : null;
                })()}
                <div className="fallback-text text-muted-foreground text-xs text-center p-4" style={{display: 'none'}}>
                  {illustration.title}
                </div>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-background/90 hover:bg-background text-foreground gap-1 hover:scale-110 active:scale-95 transition-all duration-200 transform hover:shadow-lg"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Navigate to detail page
                    window.location.href = `/illustration/${illustration.id}`;
                  }}
                >
                  <Eye className="h-3 w-3" />
                  View
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1 hover:scale-110 active:scale-95 transition-all duration-200 transform hover:shadow-lg hover:shadow-primary/25"
                  onClick={(e) => handleDownload(illustration, e)}
                >
                  <Download className="h-3 w-3" />
                  Download
                </Button>
              </div>

              {/* Download Count Badge */}
              {illustration.download_count > 0 && (
                <div className="absolute top-2 right-2 bg-background/90 text-foreground px-2 py-1 rounded-full text-xs font-medium">
                  {formatDownloadCount(illustration.download_count)} downloads
                </div>
              )}
            </div>

            <CardContent className="p-3">
              <h3 className="font-medium text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                {illustration.title}
              </h3>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>{illustration.orientation}</span>
                {illustration.topic && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    {illustration.topic}
                  </Badge>
                )}
              </div>

              {illustration.tags && illustration.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {illustration.tags.slice(0, 2).map((tag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-xs px-1 py-0 h-5"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {illustration.tags.length > 2 && (
                    <Badge
                      variant="outline"
                      className="text-xs px-1 py-0 h-5 text-muted-foreground"
                    >
                      +{illustration.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default IllustrationGrid;