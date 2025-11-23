import { useEffect, useState } from "react";
import { useGameAPI } from "@/hooks/useGameAPI";
import { Game, GameEvent, GameParticipant } from "@/types/games";
import { PollGame } from "./PollGame";
import { WouldYouRatherGame } from "./WouldYouRatherGame";
import { QuestionOfTheDayGame } from "./QuestionOfTheDayGame";
import { StoryChainGame } from "./StoryChainGame";
import { RateThisGame } from "./RateThisGame";
import { notify } from "@/components/ui/custom-notification";
import { supabase } from "@/integrations/supabase/client";

interface GameWrapperProps {
  gameId: string;
  userId: string;
}

export const GameWrapper = ({ gameId, userId }: GameWrapperProps) => {
  const [game, setGame] = useState<Game | null>(null);
  const [participants, setParticipants] = useState<GameParticipant[]>([]);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { getGame, joinGame, gameAction } = useGameAPI();

  useEffect(() => {
    loadGame();
    setupRealtime();
  }, [gameId]);

  const setupRealtime = () => {
    const channel = supabase
      .channel(`game_${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        () => {
          loadGame();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_events',
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          loadGame();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadGame = async () => {
    try {
      const data = await getGame(gameId);
      setGame(data.game);
      setParticipants(data.participants);
      setEvents(data.events);
    } catch (error) {
      console.error("Error loading game:", error);
      notify("Error loading game");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    try {
      await joinGame(gameId);
      loadGame();
    } catch (error) {
      console.error("Error joining game:", error);
      notify("Error joining game");
    }
  };

  const handleAction = async (eventType: string, payload: any, status?: string, metadataPatch?: any) => {
    try {
      await gameAction(gameId, eventType, payload, status, metadataPatch);
      notify("Action submitted!");
    } catch (error) {
      console.error("Error performing action:", error);
      notify("Error performing action");
    }
  };

  if (loading || !game) {
    return <div className="w-80 h-80 bg-muted animate-pulse rounded-lg" />;
  }

  const isParticipant = participants.some(p => p.user_id === userId);
  if (!isParticipant) {
    return (
      <div className="w-80 p-6 bg-card rounded-lg shadow-lg text-center space-y-4">
        <h3 className="text-lg font-bold">{game.title || game.type}</h3>
        <button 
          onClick={handleJoinGame}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Join Game
        </button>
      </div>
    );
  }

  switch (game.type) {
    case 'poll':
      return (
        <PollGame
          gameId={gameId}
          title={game.title}
          metadata={game.metadata}
          userVotes={events.filter(e => e.user_id === userId && e.event_type === 'vote').map(e => e.payload.optionId)}
          onVote={(optionIds) => {
            const updatedOptions = game.metadata.options.map((opt: any) => ({
              ...opt,
              voteCount: optionIds.includes(opt.id) ? opt.voteCount + 1 : opt.voteCount,
            }));
            handleAction('vote', { optionIds }, undefined, { options: updatedOptions, allowMultiple: game.metadata.allowMultiple });
          }}
          isFinished={game.status === 'finished'}
        />
      );

    case 'would_you_rather':
      return (
        <WouldYouRatherGame
          gameId={gameId}
          title={game.title}
          metadata={game.metadata}
          userId={userId}
          onVote={(choice) => {
            const updatedMetadata = {
              ...game.metadata,
              [choice === 'A' ? 'optionA' : 'optionB']: {
                ...game.metadata[choice === 'A' ? 'optionA' : 'optionB'],
                votes: [...game.metadata[choice === 'A' ? 'optionA' : 'optionB'].votes, userId],
              },
            };
            handleAction('vote', { choice }, undefined, updatedMetadata);
          }}
          isFinished={game.status === 'finished'}
        />
      );

    case 'question_of_the_day':
      return (
        <QuestionOfTheDayGame
          gameId={gameId}
          title={game.title}
          metadata={game.metadata}
          userId={userId}
          onAnswer={(answer) => {
            const updatedResponses = [
              ...game.metadata.responses,
              { userId, answer, timestamp: new Date().toISOString() },
            ];
            handleAction('answer', { answer }, undefined, { ...game.metadata, responses: updatedResponses });
          }}
          isFinished={game.status === 'finished'}
        />
      );

    case 'story_chain':
      return (
        <StoryChainGame
          gameId={gameId}
          title={game.title}
          metadata={game.metadata}
          userId={userId}
          onAddPart={(text) => {
            const updatedParts = [
              ...game.metadata.storyParts,
              { userId, text, timestamp: new Date().toISOString() },
            ];
            handleAction('add_part', { text }, undefined, { ...game.metadata, storyParts: updatedParts });
          }}
          isFinished={game.status === 'finished'}
        />
      );

    case 'rate_this':
      return (
        <RateThisGame
          gameId={gameId}
          title={game.title}
          metadata={game.metadata}
          userId={userId}
          onRate={(rating) => {
            const updatedRatings = [
              ...game.metadata.ratings,
              { userId, rating, timestamp: new Date().toISOString() },
            ];
            handleAction('rate', { rating }, undefined, { ...game.metadata, ratings: updatedRatings });
          }}
          isFinished={game.status === 'finished'}
        />
      );

    default:
      return <div>Unknown game type</div>;
  }
};
