import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload as UploadIcon, X, Image, FileText, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FileValidation {
  isValid: boolean;
  error?: string;
  width?: number;
  height?: number;
}

const Upload = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'failed'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  
  // Form data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('');
  
  // Validation state
  const [fileValidation, setFileValidation] = useState<FileValidation>({ isValid: false });

  // Predefined options
  const topics = [
    'business', 'technology', 'people', 'abstract', 'nature', 'education',
    'medical', 'food', 'travel', 'sports', 'music', 'fashion', 'animals',
    'buildings', 'transportation', 'science', 'art', 'lifestyle'
  ];

  const styles = [
    'flat', 'line-art', 'minimalist', 'detailed', 'cartoon', 'realistic',
    'geometric', 'hand-drawn', 'isometric', 'gradient', 'monochrome'
  ];

  const validateFile = useCallback(async (file: File): Promise<FileValidation> => {
    // Check file type
    if (!['image/svg+xml', 'image/png'].includes(file.type)) {
      return { isValid: false, error: 'Only SVG and PNG files are allowed' };
    }

    // Check file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return { isValid: false, error: 'File size must be less than 50MB' };
    }

    // For image files, check dimensions using Image element
    if (file.type === 'image/png' || file.type === 'image/svg+xml') {
      try {
        const dimensions = await getImageDimensions(file);
        const longEdge = Math.max(dimensions.width, dimensions.height);
        
        if (longEdge < 2000) {
          return { 
            isValid: false, 
            error: `Image must have a minimum long edge of 2000 pixels (current: ${longEdge}px)`,
            width: dimensions.width,
            height: dimensions.height
          };
        }
        
        return { 
          isValid: true, 
          width: dimensions.width, 
          height: dimensions.height 
        };
      } catch (error) {
        return { isValid: false, error: 'Failed to read image dimensions' };
      }
    }

    return { isValid: true };
  }, []);

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl); // Release memory
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl); // Release memory even on error
        reject(new Error('Failed to load image'));
      };
      
      img.src = objectUrl;
    });
  };

  const handleFileSelect = async (selectedFile: File) => {
    const validation = await validateFile(selectedFile);
    setFileValidation(validation);
    
    if (validation.isValid) {
      setFile(selectedFile);
      
      // Create optimistic preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const newPreviewUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(newPreviewUrl);
      
      // Auto-fill title from filename if empty
      if (!title) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
        setTitle(nameWithoutExt.replace(/[-_]/g, ' '));
      }
    } else {
      toast.error(validation.error);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      await handleFileSelect(droppedFiles[0]);
    }
  }, []);

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim()) && tags.length < 10) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const uploadFile = async (): Promise<void> => {
    if (!file || !fileValidation.isValid) {
      throw new Error('Invalid file');
    }

    // Get session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('You must be logged in to upload files');
    }

    // Get presigned upload URL
    const { data: urlData, error: urlError } = await supabase.functions.invoke(
      'generate-upload-url',
      {
        body: {
          filename: file.name,
          contentType: file.type,
          fileSize: file.size,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (urlError || !urlData) {
      throw new Error(urlData?.error || 'Failed to get upload URL');
    }

    // Upload file with progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          try {
            console.log('File uploaded successfully, key:', urlData.key, 'size:', file.size, 'type:', file.type);
            
            // Create illustration record after successful upload
            const { data: createData, error: createError } = await supabase.functions.invoke(
              'create-illustration',
              {
                body: {
                  title,
                  description,
                  tags,
                  file_path: urlData.key,
                  contentType: file.type,
                },
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                },
              }
            );

            if (createError || !createData?.success) {
              throw new Error(createData?.error || 'Failed to create illustration record');
            }

            const illustration = createData.illustration;
            console.log('Illustration record created:', illustration.id);

            setProcessingStatus('completed');
            toast.success('Illustration uploaded successfully! It will be reviewed before being published.');
            
            // Reset form after successful completion
            setTimeout(() => {
              // Clean up preview URL
              if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
              }
              
              setFile(null);
              setFileValidation({ isValid: false });
              setTitle('');
              setDescription('');
              setTags([]);
              setTopic('');
              setStyle('');
              setProcessingStatus('idle');
              navigate('/browse');
            }, 2000);
            
            resolve();
          } catch (error) {
            reject(error);
          }
        } else {
          const errorText = await xhr.responseText || 'Unknown error';
          reject(new Error(`Upload failed with status ${xhr.status}: ${errorText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('PUT', urlData.url);
      
      // Set Content-Type header to match what was used to generate the presigned URL
      xhr.setRequestHeader('Content-Type', urlData.contentType || file.type);
      
      // Add any additional headers that were included in the presigned URL
      if (urlData.headers) {
        Object.entries(urlData.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value as string);
        });
      }
      
      xhr.send(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !fileValidation.isValid) {
      toast.error('Please select a valid file');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setProcessingStatus('uploading');

    try {
      await uploadFile();
      
      // Upload and creation completed successfully
      
    } catch (error) {
      console.error('Upload error:', error);
      setProcessingStatus('failed');
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Upload Illustration</h1>
          <p className="text-muted-foreground text-lg">
            Share your creative work with the community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UploadIcon className="h-5 w-5" />
                Choose File
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-colors
                  ${dragActive ? 'border-primary bg-primary/5' : 'border-border'}
                  ${file && fileValidation.isValid ? 'border-green-500 bg-green-500/5' : ''}
                  ${file && !fileValidation.isValid ? 'border-destructive bg-destructive/5' : ''}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".svg,.png,image/svg+xml,image/png"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />

                {!file ? (
                  <>
                    <UploadIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">Drop your file here or click to browse</p>
                    <p className="text-muted-foreground mb-4">
                      SVG or PNG files only • Max 50MB • PNG min 2000px long edge
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Select File
                    </Button>
                  </>
                 ) : (
                   <div className="space-y-4">
                     {/* Preview Image */}
                     {previewUrl && (
                       <div className="w-full max-w-xs mx-auto">
                         <img
                           src={previewUrl}
                           alt="Preview"
                           className="w-full aspect-square object-cover rounded-lg border"
                         />
                       </div>
                     )}
                     
                     <div className="flex items-center justify-center gap-3">
                       {file.type === 'image/svg+xml' ? (
                         <FileText className="h-8 w-8 text-blue-500" />
                       ) : (
                         <Image className="h-8 w-8 text-green-500" />
                       )}
                       <div className="text-left">
                         <p className="font-medium">{file.name}</p>
                         <p className="text-sm text-muted-foreground">
                           {(file.size / 1024 / 1024).toFixed(2)} MB
                           {fileValidation.width && fileValidation.height && (
                             ` • ${fileValidation.width}×${fileValidation.height}px`
                           )}
                         </p>
                       </div>
                       {fileValidation.isValid ? (
                         <Check className="h-5 w-5 text-green-500" />
                       ) : (
                         <AlertCircle className="h-5 w-5 text-destructive" />
                       )}
                     </div>

                    {!fileValidation.isValid && (
                      <div className="text-destructive text-sm">
                        {fileValidation.error}
                      </div>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (previewUrl) {
                          URL.revokeObjectURL(previewUrl);
                          setPreviewUrl(null);
                        }
                        setFile(null);
                        setFileValidation({ isValid: false });
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                )}
              </div>

              {isUploading && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Illustration Details */}
          <Card>
            <CardHeader>
              <CardTitle>Illustration Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a descriptive title..."
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your illustration..."
                  rows={3}
                />
              </div>

              {/* Tags */}
              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="space-y-2">
                  <Input
                    id="tags"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Add tags (press Enter or comma to add)"
                    maxLength={50}
                  />
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:bg-secondary-foreground/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {tags.length}/10 tags • Help others find your illustration
                  </p>
                </div>
              </div>

              {/* Topic and Style */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="topic">Topic</Label>
                  <Select value={topic} onValueChange={setTopic}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a topic..." />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map((topicOption) => (
                        <SelectItem key={topicOption} value={topicOption}>
                          {topicOption.charAt(0).toUpperCase() + topicOption.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="style">Style</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a style..." />
                    </SelectTrigger>
                    <SelectContent>
                      {styles.map((styleOption) => (
                        <SelectItem key={styleOption} value={styleOption}>
                          {styleOption.charAt(0).toUpperCase() + styleOption.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/')}
              disabled={isUploading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={!file || !fileValidation.isValid || !title.trim() || isUploading || processingStatus !== 'idle'}
              className="min-w-32"
            >
              {processingStatus === 'uploading' && 'Uploading...'}
              {processingStatus === 'processing' && 'Processing...'}
              {processingStatus === 'completed' && 'Completed ✓'}
              {processingStatus === 'failed' && 'Failed - Try Again'}
              {processingStatus === 'idle' && 'Upload Illustration'}
            </Button>
          </div>
          
          {processingStatus === 'processing' && (
            <div className="text-center text-sm text-muted-foreground mt-4">
              Your illustration is being processed. This may take a few moments...
            </div>
          )}
          
          {processingStatus === 'completed' && (
            <div className="text-center text-sm text-green-600 mt-4">
              Processing complete! Your illustration is ready for review.
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Upload;