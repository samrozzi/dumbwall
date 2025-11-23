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
    const params = circleId ? `?circle_id=${circleId}` : '';
    return callGameFunction(`/${params}`, "GET");
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
    return callGameFunction(`/${gameId}`, "GET");
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
