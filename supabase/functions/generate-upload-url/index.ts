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

    const { filename, contentType, fileSize } = await req.json();

    // Validate file type
    const allowedTypes = ['image/svg+xml', 'image/png'];
    if (!allowedTypes.includes(contentType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only SVG and PNG files are allowed.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (fileSize > maxSize) {
      return new Response(
        JSON.stringify({ error: 'File size too large. Maximum size is 50MB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique file path
    const fileExtension = filename.split('.').pop();
    const uniqueFilename = `${crypto.randomUUID()}.${fileExtension}`;
    const filePath = `${user.id}/${uniqueFilename}`;

    // Generate presigned URL for upload
    const { data: signedUrlData, error: urlError } = await supabaseClient.storage
      .from('illustrations-raw')
      .createSignedUploadUrl(filePath, {
        upsert: false,
      });

    if (urlError) {
      console.error('Error generating presigned URL:', urlError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate upload URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        uploadUrl: signedUrlData.signedUrl,
        path: filePath,
        token: signedUrlData.token,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-upload-url function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});