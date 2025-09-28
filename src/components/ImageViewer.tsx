import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ZoomIn, ZoomOut, RotateCcw, Maximize, X, Move } from 'lucide-react';

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  isFullscreen?: boolean;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ 
  isOpen, 
  onClose, 
  imageUrl, 
  title,
  isFullscreen = false 
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset on image change
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageUrl]);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev * 1.2, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev / 1.2, 0.1));
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleFullscreen = useCallback(() => {
    if (imageUrl) {
      window.open(imageUrl, '_blank');
    }
  }, [imageUrl]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  }, [scale, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart, scale]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(Math.max(prev * delta, 0.1), 5));
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case '=':
      case '+':
        handleZoomIn();
        break;
      case '-':
        handleZoomOut();
        break;
      case '0':
        handleReset();
        break;
    }
  }, [isOpen, onClose, handleZoomIn, handleZoomOut, handleReset]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/90 border-none">
        <DialogHeader className="absolute top-4 left-4 right-4 z-10 flex flex-row items-center justify-between bg-black/50 rounded-lg p-3 backdrop-blur-sm">
          <DialogTitle className="text-white text-lg truncate pr-4">{title}</DialogTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {/* Control Panel */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-2 bg-black/50 rounded-lg p-2 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="text-white hover:bg-white/20"
            title="Zoom Out (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-white text-sm min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="text-white hover:bg-white/20"
            title="Zoom In (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-white hover:bg-white/20"
            title="Reset (0)"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFullscreen}
            className="text-white hover:bg-white/20"
            title="Open in New Tab"
          >
            <Maximize className="h-4 w-4" />
          </Button>
          
          {scale > 1 && (
            <div className="flex items-center gap-1 text-white text-xs">
              <Move className="h-3 w-3" />
              <span>Drag to pan</span>
            </div>
          )}
        </div>

        {/* Image Container */}
        <div 
          ref={containerRef}
          className="w-full h-[95vh] overflow-hidden flex items-center justify-center cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt={title}
            className="max-w-none transition-transform duration-200"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transformOrigin: 'center center'
            }}
            draggable={false}
            onLoad={() => {
              // Auto-fit image to container on load
              if (containerRef.current && imageRef.current) {
                const container = containerRef.current;
                const image = imageRef.current;
                const containerRatio = container.clientWidth / container.clientHeight;
                const imageRatio = image.naturalWidth / image.naturalHeight;
                
                const fitScale = containerRatio > imageRatio 
                  ? (container.clientHeight * 0.9) / image.naturalHeight
                  : (container.clientWidth * 0.9) / image.naturalWidth;
                
                setScale(Math.min(fitScale, 1));
              }
            }}
          />
        </div>

        {/* Instructions */}
        <div className="absolute top-20 right-4 z-10 bg-black/50 rounded-lg p-3 backdrop-blur-sm text-white text-sm max-w-[200px]">
          <div className="space-y-1">
            <div><strong>Mouse wheel:</strong> Zoom</div>
            <div><strong>Drag:</strong> Pan (when zoomed)</div>
            <div><strong>Keyboard:</strong></div>
            <div className="text-xs text-white/80 ml-2">
              <div>+ / - : Zoom in/out</div>
              <div>0 : Reset view</div>
              <div>ESC : Close</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewer;