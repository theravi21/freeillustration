import React from 'react';
import { AlertCircle, Check, FileText, Image } from 'lucide-react';

interface FileValidatorProps {
  file: File | null;
  validation: {
    isValid: boolean;
    error?: string;
    width?: number;
    height?: number;
  };
}

const FileValidator: React.FC<FileValidatorProps> = ({ file, validation }) => {
  if (!file) return null;

  return (
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
          {validation.width && validation.height && (
            ` • ${validation.width}×${validation.height}px`
          )}
        </p>
      </div>
      {validation.isValid ? (
        <Check className="h-5 w-5 text-green-500" />
      ) : (
        <AlertCircle className="h-5 w-5 text-destructive" />
      )}
    </div>
  );
};

export default FileValidator;