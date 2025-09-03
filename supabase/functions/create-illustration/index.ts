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
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { title, description, tags, file_path, contentType } = await req.json();

    // Validate file_path is provided and starts with the correct prefix
    if (!file_path || !file_path.startsWith(`illustrations/${user.id}/`)) {
      console.error('Invalid file_path:', file_path, 'for user:', user.id);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid file_path. Must be non-empty and start with illustrations/{your_user_id}/' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // HEAD check to confirm the object exists and has expected Content-Type
    try {
      const { data: headData, error: headError } = await supabaseClient.storage
        .from('illustrations-raw')
        .download(file_path, {
          transform: {
            width: 1,
            height: 1,
          }
        });

      if (headError) {
        console.error('HEAD check failed for file_path:', file_path, 'Error:', headError);
        return new Response(
          JSON.stringify({ 
            error: 'File not found or inaccessible at the specified path' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('File confirmed to exist at path:', file_path);
    } catch (error) {
      console.error('Error during file verification:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to verify file existence' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert into illustrations table
    const { data: illustration, error: insertError } = await supabaseClient
      .from('illustrations')
      .insert({
        title: title || 'Untitled',
        description: description || null,
        tags: tags || [],
        file_path,
        creator_id: user.id,
        status: 'draft',
        original_filename: file_path.split('/').pop(), // Extract filename from path
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting illustration:', insertError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create illustration record',
          details: insertError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate viewUrl for immediate display
    const { data: { publicUrl } } = supabaseClient.storage
      .from('illustrations-raw')
      .getPublicUrl(file_path);

    console.log('Illustration created successfully:', {
      id: illustration.id,
      file_path,
      title,
      creator_id: user.id,
      viewUrl: publicUrl
    });

    return new Response(
      JSON.stringify({
        success: true,
        illustration: {
          ...illustration,
          viewUrl: publicUrl
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-illustration function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});