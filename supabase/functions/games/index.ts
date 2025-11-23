import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const client = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

async function getUser(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;

  const { data } = await client.auth.getUser(token);
  return data.user ?? null;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname.replace(/^\/games/, "");
    const method = req.method.toUpperCase();

    const user = await getUser(req);
    if (!user) {
      return json({ error: "Unauthorized" }, 401);
    }

    // Helper: parse JSON body
    const parseBody = async <T = any>(): Promise<T> => {
      if (method === "GET") return {} as T;
      const text = await req.text();
      return text ? JSON.parse(text) : ({} as T);
    };

    // ROUTING
    // 1) /games (list or create)
    if (pathname === "" || pathname === "/") {
      if (method === "GET") {
        return await listGames(req, user.id);
      } else if (method === "POST") {
        const body = await parseBody();
        return await createGame(req, user.id, body);
      }
    }

    // 2) /games/:id, /games/:id/join, /games/:id/action
    const parts = pathname.split("/").filter(Boolean);
    const gameId = parts[0];
    const subPath = parts[1];

    if (!gameId) {
      return json({ error: "Not found" }, 404);
    }

    // GET /games/:id
    if (!subPath && method === "GET") {
      return await getGame(req, user.id, gameId);
    }

    // POST /games/:id/join
    if (subPath === "join" && method === "POST") {
      return await joinGame(req, user.id, gameId);
    }

    // POST /games/:id/action
    if (subPath === "action" && method === "POST") {
      const body = await parseBody();
      return await gameAction(req, user.id, gameId, body);
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    console.error("Games function error:", err);
    return json({ error: "Server error" }, 500);
  }
});

// ============================================================================
// HANDLERS
// ============================================================================

async function listGames(_req: Request, userId: string): Promise<Response> {
  const url = new URL(_req.url);
  const circleId = url.searchParams.get("circle_id");

  let query = client
    .from("games")
    .select(`
      *,
      game_participants!inner(
        user_id
      )
    `)
    .eq("game_participants.user_id", userId)
    .order("updated_at", { ascending: false });

  if (circleId) {
    query = query.eq("circle_id", circleId);
  }

  const { data, error } = await query;
  if (error) {
    console.error(error);
    return json({ error: error.message }, 400);
  }

  return json({ games: data });
}

async function createGame(_req: Request, userId: string, body: any): Promise<Response> {
  const {
    circle_id,
    type,
    title,
    description,
    metadata,
    status,
  } = body;

  if (!circle_id || !type) {
    return json({ error: "circle_id and type are required" }, 400);
  }

  const { data: game, error } = await client
    .from("games")
    .insert({
      circle_id,
      type,
      title: title ?? null,
      description: description ?? null,
      metadata: metadata ?? {},
      status: status ?? "waiting",
      created_by: userId,
    })
    .select("*")
    .single();

  if (error) {
    console.error(error);
    return json({ error: error.message }, 400);
  }

  // Add creator as participant (owner)
  const { error: pErr } = await client
    .from("game_participants")
    .insert({
      game_id: game.id,
      user_id: userId,
      role: "owner",
    });

  if (pErr) {
    console.error(pErr);
  }

  return json({ game }, 201);
}

async function getGame(_req: Request, userId: string, gameId: string): Promise<Response> {
  const { data: game, error: gErr } = await client
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single();

  if (gErr || !game) {
    console.error(gErr);
    return json({ error: "Game not found" }, 404);
  }

  const { data: participants, error: pErr } = await client
    .from("game_participants")
    .select(`
      *,
      profiles (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq("game_id", gameId);

  if (pErr) {
    console.error(pErr);
  }

  const { data: events, error: eErr } = await client
    .from("game_events")
    .select("*")
    .eq("game_id", gameId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (eErr) {
    console.error(eErr);
  }

  return json({
    game,
    participants: participants ?? [],
    events: events ?? [],
    currentUserId: userId,
  });
}

async function joinGame(_req: Request, userId: string, gameId: string): Promise<Response> {
  const { data: existing } = await client
    .from("game_participants")
    .select("*")
    .eq("game_id", gameId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return json({ participant: existing });
  }

  const { data: participant, error } = await client
    .from("game_participants")
    .insert({
      game_id: gameId,
      user_id: userId,
      role: "player",
    })
    .select("*")
    .single();

  if (error) {
    console.error(error);
    return json({ error: error.message }, 400);
  }

  return json({ participant }, 201);
}

async function gameAction(
  _req: Request,
  userId: string,
  gameId: string,
  body: any
): Promise<Response> {
  // Validate input
  const GameActionSchema = z.object({
    event_type: z.enum(['move', 'vote', 'answer', 'submit', 'forfeit', 'start', 'join', 'leave']),
    payload: z.record(z.any()).refine(
      (val) => JSON.stringify(val).length < 10000,
      { message: 'Payload too large (max 10000 characters)' }
    ),
    status: z.enum(['waiting', 'in_progress', 'finished', 'cancelled']).optional(),
    metadataPatch: z.record(z.any()).optional()
  });

  let event_type, payload, status, metadataPatch;
  try {
    const validated = GameActionSchema.parse(body);
    event_type = validated.event_type;
    payload = validated.payload;
    status = validated.status;
    metadataPatch = validated.metadataPatch;
  } catch (error) {
    return json({ error: 'Invalid input: ' + (error as Error).message }, 400);
  }

  if (!event_type) {
    return json({ error: "event_type is required" }, 400);
  }

  // Insert event
  const { data: event, error: eErr } = await client
    .from("game_events")
    .insert({
      game_id: gameId,
      user_id: userId,
      event_type,
      payload,
    })
    .select("*")
    .single();

  if (eErr) {
    console.error(eErr);
    return json({ error: eErr.message }, 400);
  }

  // Optionally patch metadata and/or status on the game
  if (status || metadataPatch) {
    const patch: any = {};
    if (status) patch.status = status;
    if (metadataPatch) {
      patch.metadata = metadataPatch;
    }

    if (Object.keys(patch).length > 0) {
      patch.updated_at = new Date().toISOString();
      const { error: gErr } = await client
        .from("games")
        .update(patch)
        .eq("id", gameId);

      if (gErr) {
        console.error(gErr);
      }
    }
  }

  return json({ event });
}

// ============================================================================
// Helper for JSON responses
// ============================================================================

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
