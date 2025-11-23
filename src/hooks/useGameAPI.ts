import { supabase } from "@/integrations/supabase/client";
import { Game, GameEvent, GameParticipant } from "@/types/games";

export const useGameAPI = () => {
  const callGameFunction = async (path: string, method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET", body?: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error("Not authenticated");
    }

    const response = await supabase.functions.invoke('games', {
      body: method !== "GET" ? body : undefined,
      method: method as any,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (response.error) {
      throw response.error;
    }

    return response.data;
  };

  const listGames = async (circleId?: string): Promise<{ games: Game[] }> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error("Not authenticated");
    }

    const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/games`);
    if (circleId) {
      url.searchParams.append('circle_id', circleId);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch games');
    }

    return response.json();
  };

  const createGame = async (gameData: {
    circle_id: string;
    type: string;
    title?: string;
    description?: string;
    metadata?: any;
    status?: string;
  }): Promise<{ game: Game }> => {
    return callGameFunction('/', "POST", gameData);
  };

  const getGame = async (gameId: string): Promise<{
    game: Game;
    participants: GameParticipant[];
    events: GameEvent[];
    currentUserId: string;
  }> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error("Not authenticated");
    }

    const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/games/${gameId}`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to fetch game:', error);
      throw new Error('Failed to fetch game');
    }

    return response.json();
  };

  const joinGame = async (gameId: string): Promise<{ participant: GameParticipant }> => {
    return callGameFunction(`/${gameId}/join`, "POST");
  };

  const gameAction = async (
    gameId: string,
    eventType: string,
    payload: any,
    status?: string,
    metadataPatch?: any
  ): Promise<{ event: GameEvent }> => {
    return callGameFunction(`/${gameId}/action`, "POST", {
      event_type: eventType,
      payload,
      status,
      metadataPatch,
    });
  };

  return {
    listGames,
    createGame,
    getGame,
    joinGame,
    gameAction,
  };
};
