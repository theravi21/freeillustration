import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      filePath, 
      originalFilename, 
      fileSize, 
      title, 
      description, 
      tags, 
      topic, 
      style 
    } = await req.json();

    // Create illustration record with Draft status
    const { data: illustration, error: insertError } = await supabaseClient
      .from('illustrations')
      .insert({
        title,
        description,
        tags: tags || [],
        topic,
        style,
        raw_file_path: filePath,
        original_filename: originalFilename,
        original_file_size: fileSize,
        creator_id: user.id,
        status: 'draft',
        processing_status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating illustration record:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create illustration record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Start background processing
    processIllustrationBackground(illustration.id, filePath, originalFilename, supabaseClient);

    return new Response(
      JSON.stringify({ 
        success: true, 
        illustrationId: illustration.id,
        message: 'Upload successful. Processing started.' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-illustration function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Background processing function
async function processIllustrationBackground(
  illustrationId: string, 
  filePath: string, 
  originalFilename: string,
  supabaseClient: any
) {
  try {
    console.log(`Starting background processing for illustration ${illustrationId}`, {
      filePath,
      originalFilename
    });
    
    // Update status to processing
    await supabaseClient
      .from('illustrations')
      .update({ processing_status: 'processing' })
      .eq('id', illustrationId);

    // Download the original file
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('illustrations-raw')
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error(`Failed to download file from storage: ${downloadError.message}`);
    }

    console.log('File downloaded successfully, size:', fileData.size, 'bytes');

    const fileBuffer = await fileData.arrayBuffer();
    const fileType = originalFilename.toLowerCase().endsWith('.svg') ? 'svg' : 'png';
    
    console.log('Processing file type:', fileType);
    
    let processedData: any = {};

    try {
      if (fileType === 'svg') {
        // Process SVG file with enhanced error handling
        processedData = await processSVG(fileBuffer, illustrationId, supabaseClient);
      } else {
        // Process PNG file with enhanced error handling
        processedData = await processPNG(fileBuffer, illustrationId, supabaseClient);
      }
    } catch (processingError) {
      console.error('File processing error:', processingError);
      throw processingError; // Re-throw to be caught by outer catch
    }

    // Update illustration record with processed data
    await supabaseClient
      .from('illustrations')
      .update({
        ...processedData,
        processing_status: 'completed',
        processing_error: null,
        status: 'pending' // Ready for moderation
      })
      .eq('id', illustrationId);

    console.log(`Background processing completed successfully for illustration ${illustrationId}`);

  } catch (error) {
    console.error(`Background processing failed for illustration ${illustrationId}:`, error);
    
    // Determine user-friendly error message
    let userMessage = 'Processing failed due to an unexpected error.';
    
    if (error.message.includes('Unsupported file format') || error.message.includes('Invalid')) {
      userMessage = 'File format not supported or file is invalid. Please upload PNG or SVG files only.';
    } else if (error.message.includes('corrupt') || error.message.includes('invalid')) {
      userMessage = 'File appears to be corrupted or invalid. Please try uploading a different file.';
    } else if (error.message.includes('memory') || error.message.includes('size') || error.message.includes('large')) {
      userMessage = 'File is too large to process. Please reduce file size and try again.';
    } else if (error.message.includes('external') || error.message.includes('reference')) {
      userMessage = 'SVG contains external references which are not allowed for security reasons.';
    } else if (error.message.includes('download') || error.message.includes('storage')) {
      userMessage = 'Failed to access uploaded file. Please try uploading again.';
    } else if (error.message.includes('dimensions') || error.message.includes('2000')) {
      userMessage = 'Image does not meet minimum size requirements (2000px minimum long edge).';
    }
    
    // Update with error status and user-friendly message
    await supabaseClient
      .from('illustrations')
      .update({
        processing_status: 'failed',
        processing_error: userMessage
      })
      .eq('id', illustrationId);
  }
}

async function processSVG(buffer: ArrayBuffer, illustrationId: string, supabaseClient: any) {
  try {
    console.log('Processing SVG file for illustration:', illustrationId);
    
    // Convert buffer to string for SVG processing
    const svgContent = new TextDecoder().decode(buffer);
    
    if (!svgContent || svgContent.length === 0) {
      throw new Error('SVG file is empty or corrupt');
    }

    // Check for external image references (security check)
    if (svgContent.includes('<image') && (
        svgContent.includes('http://') || 
        svgContent.includes('https://') || 
        svgContent.includes('data:') ||
        svgContent.includes('xlink:href')
      )) {
      throw new Error('SVG contains external image references which are not allowed for security reasons');
    }
    
    // Basic SVG validation
    if (!svgContent.includes('<svg') || !svgContent.includes('</svg>')) {
      throw new Error('Invalid SVG file format');
    }
    
    // Basic SVG sanitization (remove scripts, etc.)
    const sanitizedSvg = sanitizeSVG(svgContent);
    
    if (!sanitizedSvg || sanitizedSvg.length === 0) {
      throw new Error('SVG file is invalid or corrupt after sanitization');
    }
    
    // Extract dimensions
    const dimensions = extractSVGDimensions(sanitizedSvg);
    
    if (!dimensions.width || !dimensions.height || dimensions.width <= 0 || dimensions.height <= 0) {
      throw new Error('Unable to extract valid dimensions from SVG file');
    }

    console.log('SVG dimensions extracted:', dimensions);
    
    // Generate a simple PNG thumbnail (this is a basic implementation)
    // In a real scenario, you'd use a proper SVG-to-PNG converter
    const thumbnailPath = await generateSVGThumbnail(sanitizedSvg, illustrationId, supabaseClient);
    
    // Extract dominant color (simplified)
    const dominantColor = extractSVGColor(sanitizedSvg);

    console.log('SVG processing completed for illustration:', illustrationId);

    return {
      svg_path: `processed/${illustrationId}/sanitized.svg`,
      thumbnail_path: thumbnailPath,
      dimensions_width: dimensions.width,
      dimensions_height: dimensions.height,
      dominant_color: dominantColor,
      orientation: getOrientation(dimensions.width, dimensions.height),
    };
  } catch (error) {
    console.error('SVG processing error:', error);
    throw error; // Re-throw to be caught by main handler
  }
}

async function processPNG(buffer: ArrayBuffer, illustrationId: string, supabaseClient: any) {
  try {
    console.log('Processing PNG file for illustration:', illustrationId);
    
    // Validate file is actually a PNG by checking magic bytes
    const view = new DataView(buffer);
    if (buffer.byteLength < 8 || 
        view.getUint8(0) !== 0x89 || view.getUint8(1) !== 0x50 || 
        view.getUint8(2) !== 0x4E || view.getUint8(3) !== 0x47) {
      throw new Error('File is not a valid PNG format or is corrupt');
    }
    
    // Check file size for memory limits (100MB processing limit)
    if (buffer.byteLength > 100 * 1024 * 1024) {
      throw new Error('PNG file is too large to process - memory limit exceeded');
    }
    
    // Extract dimensions with error handling
    const dimensions = await extractPNGDimensions(buffer);
    
    if (!dimensions.width || !dimensions.height || dimensions.width <= 0 || dimensions.height <= 0) {
      throw new Error('Unable to extract valid dimensions from PNG file - file may be corrupt');
    }
    
    // Validate minimum dimensions for PNG
    const longEdge = Math.max(dimensions.width, dimensions.height);
    if (longEdge < 2000) {
      throw new Error(`PNG file must have a minimum long edge of 2000 pixels. Current: ${longEdge}px`);
    }

    console.log('PNG dimensions validated:', dimensions);
    
    // Generate derivatives (thumbnails in different sizes)
    const thumbnailPaths = await generatePNGDerivatives(buffer, illustrationId, supabaseClient);
    
    // Extract dominant color (simplified)
    const dominantColor = await extractPNGColor(buffer);

    console.log('PNG processing completed for illustration:', illustrationId);

    return {
      thumbnail_path: thumbnailPaths.thumbnail,
      png_small_path: thumbnailPaths.small,
      png_medium_path: thumbnailPaths.medium,
      png_large_path: thumbnailPaths.large,
      dimensions_width: dimensions.width,
      dimensions_height: dimensions.height,
      dominant_color: dominantColor,
      orientation: getOrientation(dimensions.width, dimensions.height),
    };
  } catch (error) {
    console.error('PNG processing error:', error);
    throw error; // Re-throw to be caught by main handler
  }
}

function sanitizeSVG(svgContent: string): string {
  // Remove potentially dangerous elements and attributes
  return svgContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '');
}

function extractSVGDimensions(svgContent: string): { width: number; height: number } {
  const widthMatch = svgContent.match(/width="([^"]+)"/);
  const heightMatch = svgContent.match(/height="([^"]+)"/);
  const viewBoxMatch = svgContent.match(/viewBox="[^"]*\s+([^\s]+)\s+([^"]+)"/);
  
  let width = 512, height = 512; // defaults
  
  if (viewBoxMatch) {
    width = parseFloat(viewBoxMatch[1]) || 512;
    height = parseFloat(viewBoxMatch[2]) || 512;
  } else {
    width = parseFloat(widthMatch?.[1] || '512');
    height = parseFloat(heightMatch?.[1] || '512');
  }
  
  return { width, height };
}

function extractSVGColor(svgContent: string): string {
  // Extract first color found (simplified)
  const colorMatch = svgContent.match(/(fill|stroke)="(#[0-9a-fA-F]{6})"/);
  return colorMatch?.[2] || '#000000';
}

async function extractPNGDimensions(buffer: ArrayBuffer): Promise<{ width: number; height: number }> {
  // Simplified PNG header parsing
  const view = new DataView(buffer);
  // PNG signature check
  if (view.getUint32(0) !== 0x89504E47) {
    throw new Error('Invalid PNG file');
  }
  
  // Read IHDR chunk (starts at byte 16)
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  
  return { width, height };
}

async function extractPNGColor(buffer: ArrayBuffer): Promise<string> {
  // Simplified color extraction - return a default for now
  // In a real implementation, you'd analyze the image pixels
  return '#4A90E2';
}

async function generateSVGThumbnail(svgContent: string, illustrationId: string, supabaseClient: any): Promise<string> {
  // Simplified: just save the sanitized SVG as the "thumbnail"
  const path = `processed/${illustrationId}/thumbnail.svg`;
  
  await supabaseClient.storage
    .from('illustrations-processed')
    .upload(path, new Blob([svgContent], { type: 'image/svg+xml' }));
    
  return path;
}

async function generatePNGDerivatives(buffer: ArrayBuffer, illustrationId: string, supabaseClient: any) {
  // Simplified: in a real implementation, you'd resize the images
  const basePath = `processed/${illustrationId}`;
  
  // For now, just copy the original to different paths
  // In a real scenario, you'd resize to different dimensions
  const paths = {
    thumbnail: `${basePath}/thumbnail.png`,
    small: `${basePath}/small.png`,
    medium: `${basePath}/medium.png`,
    large: `${basePath}/large.png`,
  };
  
  // Upload the original as all sizes (simplified)
  const blob = new Blob([buffer], { type: 'image/png' });
  
  await Promise.all([
    supabaseClient.storage.from('illustrations-processed').upload(paths.thumbnail, blob),
    supabaseClient.storage.from('illustrations-processed').upload(paths.small, blob),
    supabaseClient.storage.from('illustrations-processed').upload(paths.medium, blob),
    supabaseClient.storage.from('illustrations-processed').upload(paths.large, blob),
  ]);
  
  return paths;
}

function getOrientation(width: number, height: number): string {
  if (width > height) return 'landscape';
  if (height > width) return 'portrait';
  return 'square';
}