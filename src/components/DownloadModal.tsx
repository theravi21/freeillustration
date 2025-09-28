import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileImage, FileType, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  illustration: {
    id: string;
    title: string;
    raw_file_path?: string;
    original_filename?: string;
    file_size?: number;
  };
  originalFormat: 'svg' | 'png';
}

const DownloadModal: React.FC<DownloadModalProps> = ({ 
  isOpen, 
  onClose, 
  illustration,
  originalFormat
}) => {
  const [downloadingOriginal, setDownloadingOriginal] = useState(false);
  const [downloadingConverted, setDownloadingConverted] = useState(false);

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

  const handleDownload = async (format: 'original' | 'png') => {
    if (!illustration?.raw_file_path) {
      toast({
        title: "Error",
        description: "File not available for download.",
        variant: "destructive",
      });
      return;
    }

    const setLoading = format === 'original' ? setDownloadingOriginal : setDownloadingConverted;
    setLoading(true);

    try {
      let fileData: Blob;
      let filename: string;

      if (format === 'original') {
        // Download original file
        const { data, error } = await supabase.storage
          .from('illustrations-processed')
          .download(illustration.raw_file_path);

        if (error) throw error;
        
        fileData = data;
        filename = illustration.original_filename || `illustration-${illustration.id}.${originalFormat}`;
      } else {
        // Convert SVG to PNG (only available for SVG originals)
        if (originalFormat !== 'svg') {
          throw new Error('PNG conversion is only available for SVG files');
        }

        // Get the SVG file first
        const { data: svgData, error: svgError } = await supabase.storage
          .from('illustrations-processed')
          .download(illustration.raw_file_path);

        if (svgError) throw svgError;

        // Convert SVG to PNG using canvas
        const svgText = await svgData.text();
        const pngBlob = await convertSvgToPng(svgText);
        
        fileData = pngBlob;
        filename = illustration.original_filename?.replace('.svg', '.png') || `illustration-${illustration.id}.png`;
      }

      // Create download link
      const url = URL.createObjectURL(fileData);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Update download count
      const { error: updateError } = await supabase.rpc('increment_download_count', { 
        illustration_id: illustration.id 
      });

      if (updateError) {
        console.error('Failed to update download count:', updateError);
      }

      toast({
        title: "Success",
        description: `Downloaded ${format === 'original' ? 'original' : 'PNG'} file successfully!`,
      });

      onClose();
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download the file.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const convertSvgToPng = async (svgText: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      const img = new Image();
      
      img.onload = () => {
        // Set canvas size to image size (or a reasonable default)
        canvas.width = img.naturalWidth || 800;
        canvas.height = img.naturalHeight || 600;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the SVG
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert SVG to PNG'));
          }
        }, 'image/png', 1.0);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load SVG'));
      };
      
      // Create data URL from SVG
      const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);
      img.src = url;
      
      // Clean up URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download Options
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <h3 className="font-semibold mb-1">{illustration.title}</h3>
            <p className="text-sm text-muted-foreground">
              Choose your preferred download format
            </p>
          </div>

          {/* Original Format */}
          <div className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {originalFormat === 'svg' ? (
                  <FileType className="h-8 w-8 text-blue-500" />
                ) : (
                  <FileImage className="h-8 w-8 text-green-500" />
                )}
                <div>
                  <div className="font-medium">Original Format</div>
                  <div className="text-sm text-muted-foreground">
                    {originalFormat.toUpperCase()} • {formatFileSize(illustration.file_size)}
                  </div>
                </div>
              </div>
              <Badge variant="secondary">Recommended</Badge>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {originalFormat === 'svg' 
                ? 'Vector format, scalable to any size without quality loss'
                : 'High-quality raster image, perfect for direct use'
              }
            </div>
            
            <Button 
              onClick={() => handleDownload('original')}
              disabled={downloadingOriginal}
              className="w-full hover:scale-105 active:scale-95 transition-all duration-200"
            >
              {downloadingOriginal ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download {originalFormat.toUpperCase()}
                </>
              )}
            </Button>
          </div>

          {/* PNG Conversion (only for SVG) */}
          {originalFormat === 'svg' && (
            <div className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileImage className="h-8 w-8 text-green-500" />
                  <div>
                    <div className="font-medium">Convert to PNG</div>
                    <div className="text-sm text-muted-foreground">
                      PNG • High Resolution
                    </div>
                  </div>
                </div>
                <Badge variant="outline">Converted</Badge>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Raster format, compatible with all image editors and applications
              </div>
              
              <Button 
                variant="outline"
                onClick={() => handleDownload('png')}
                disabled={downloadingConverted}
                className="w-full hover:scale-105 active:scale-95 transition-all duration-200"
              >
                {downloadingConverted ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <FileImage className="h-4 w-4 mr-2" />
                    Convert & Download PNG
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="text-center">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadModal;