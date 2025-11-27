import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WallItem {
  id: string;
  circle_id: string;
  type: string;
  created_at: string;
  created_by: string;
  content: any;
  profiles: {
    display_name: string | null;
    username: string;
    avatar_url: string | null;
  }[];
}

interface MobileWallItem {
  id: string;
  circleId: string;
  kind: string;
  createdAt: string;
  authorName: string;
  photoUrl: string | null;
  noteText: string | null;
  poll: any | null;
  audio: any | null;
  music: any | null;
}

function transformWallItem(item: WallItem): MobileWallItem {
  const profile = item.profiles[0] || { display_name: null, username: 'Unknown', avatar_url: null };
  const authorName = profile.display_name || profile.username;
  
  const base: MobileWallItem = {
    id: item.id,
    circleId: item.circle_id,
    kind: item.type,
    createdAt: item.created_at,
    authorName,
    photoUrl: null,
    noteText: null,
    poll: null,
    audio: null,
    music: null,
  };

  // Map based on type
  switch (item.type) {
    case 'note':
      base.kind = 'note';
      base.noteText = item.content.text || item.content.content || '';
      break;
      
    case 'image':
      base.kind = 'photo';
      base.photoUrl = item.content.url || item.content.imageUrl || null;
      break;
      
    case 'poll':
      base.kind = 'poll';
      base.poll = {
        question: item.content.question || '',
        options: (item.content.options || []).map((opt: any, idx: number) => ({
          id: opt.id || `opt-${idx}`,
          label: opt.text || opt.label || '',
          percent: opt.percentage || opt.percent || 0,
          isSelected: false, // Client can update based on user votes
        })),
      };
      break;
      
    case 'audio':
      base.kind = 'audio';
      base.audio = {
        url: item.content.url || item.content.audioUrl || '',
        duration: item.content.duration || 0,
        title: item.content.title || 'Audio Clip',
      };
      break;
      
    case 'music':
      base.kind = 'music';
      base.music = {
        title: item.content.title || item.content.songName || 'Unknown Song',
        artist: item.content.artist || item.content.artistName || 'Unknown Artist',
        artworkUrl: item.content.artworkUrl || item.content.albumArt || null,
      };
      break;
      
    case 'challenge':
      base.kind = 'challenge';
      base.noteText = item.content.title || item.content.description || '';
      break;
      
    default:
      base.kind = item.type;
      base.noteText = JSON.stringify(item.content);
  }

  return base;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    // Get query parameters
    const url = new URL(req.url);
    const circleId = url.searchParams.get('circle_id');

    // Build query
    let query = supabase
      .from('wall_items')
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
      .order('created_at', { ascending: false })
      .limit(100);

    // Filter by circle if provided
    if (circleId) {
      query = query.eq('circle_id', circleId);
    }

    const { data: wallItems, error } = await query;

    if (error) {
      console.error('Error fetching wall items:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Transform to mobile format
    const mobileItems = (wallItems || []).map(transformWallItem);

    return new Response(JSON.stringify(mobileItems), {
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
