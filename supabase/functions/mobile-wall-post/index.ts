import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateWallItemRequest {
  circleId: string;
  kind: string;
  noteText?: string;
  photoUrl?: string;
  poll?: {
    question: string;
    options: Array<{ label: string }>;
  };
  audio?: {
    url: string;
    duration: number;
    title: string;
  };
  music?: {
    title: string;
    artist: string;
    artworkUrl?: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body: CreateWallItemRequest = await req.json();
    
    if (!body.circleId || !body.kind) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: circleId and kind' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify user is a member of the circle
    const { data: membership, error: memberError } = await supabase
      .from('circle_members')
      .select('id')
      .eq('circle_id', body.circleId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return new Response(
        JSON.stringify({ error: 'Not a member of this circle' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Map kind to wall_item type and build content
    let itemType: string;
    let content: any = {};

    switch (body.kind) {
      case 'note':
        itemType = 'note';
        content = { text: body.noteText || '' };
        break;
      
      case 'photo':
        itemType = 'image';
        content = { url: body.photoUrl || '' };
        break;
      
      case 'poll':
        itemType = 'poll';
        if (!body.poll) {
          return new Response(
            JSON.stringify({ error: 'Poll data required for kind=poll' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        content = {
          question: body.poll.question,
          options: body.poll.options.map((opt, idx) => ({
            id: `opt-${idx}`,
            text: opt.label,
            votes: 0,
            percentage: 0,
          })),
        };
        break;
      
      case 'audio':
        itemType = 'audio';
        content = body.audio || {};
        break;
      
      case 'music':
        itemType = 'music';
        content = body.music || {};
        break;
      
      default:
        return new Response(
          JSON.stringify({ error: `Unsupported kind: ${body.kind}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }

    // Create the wall item
    const { data: wallItem, error: createError } = await supabase
      .from('wall_items')
      .insert({
        circle_id: body.circleId,
        created_by: user.id,
        type: itemType,
        content,
      })
      .select(`
        id,
        circle_id,
        type,
        created_at,
        created_by,
        content,
        profiles:created_by (
          display_name,
          username,
          avatar_url
        )
      `)
      .single();

    if (createError) {
      console.error('Error creating wall item:', createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Transform to mobile format
    const profile = Array.isArray(wallItem.profiles) 
      ? wallItem.profiles[0] 
      : wallItem.profiles;
    const authorName = profile?.display_name || profile?.username || 'Unknown';
    
    const mobileItem = {
      id: wallItem.id,
      circleId: wallItem.circle_id,
      kind: body.kind,
      createdAt: wallItem.created_at,
      authorName,
      photoUrl: body.kind === 'photo' ? body.photoUrl : null,
      noteText: body.kind === 'note' ? body.noteText : null,
      poll: body.kind === 'poll' ? body.poll : null,
      audio: body.kind === 'audio' ? body.audio : null,
      music: body.kind === 'music' ? body.music : null,
    };

    return new Response(JSON.stringify(mobileItem), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
