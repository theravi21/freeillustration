import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Upload } from 'lucide-react';

interface AdminPublishButtonProps {
  illustrationId: string;
  isPublished: boolean;
  onPublishChange: (id: string, published: boolean) => void;
}

const AdminPublishButton: React.FC<AdminPublishButtonProps> = ({
  illustrationId,
  isPublished,
  onPublishChange,
}) => {
  const { toast } = useToast();

  const handlePublish = async () => {
    try {
      const { error } = await supabase
        .from('illustrations')
        .update({ 
          published: !isPublished,
          status: !isPublished ? 'approved' : 'draft',
          approved_at: !isPublished ? new Date().toISOString() : null
        })
        .eq('id', illustrationId);

      if (error) {
        throw error;
      }

      onPublishChange(illustrationId, !isPublished);
      
      toast({
        title: isPublished ? 'Illustration unpublished' : 'Illustration published',
        description: isPublished 
          ? 'The illustration is now hidden from public view'
          : 'The illustration is now visible to everyone',
      });
    } catch (error: any) {
      console.error('Error updating publication status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update publication status',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      onClick={handlePublish}
      variant={isPublished ? "destructive" : "default"}
      size="sm"
      className="gap-2"
    >
      {isPublished ? (
        <>
          <CheckCircle className="h-4 w-4" />
          Unpublish
        </>
      ) : (
        <>
          <Upload className="h-4 w-4" />
          Publish
        </>
      )}
    </Button>
  );
};

export default AdminPublishButton;