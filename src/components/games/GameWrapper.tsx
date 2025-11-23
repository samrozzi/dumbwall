import { useEffect, useState } from "react";
import { useGameAPI } from "@/hooks/useGameAPI";
import { Game, GameEvent, GameParticipant } from "@/types/games";
import { PollGame } from "./PollGame";
import { WouldYouRatherGame } from "./WouldYouRatherGame";
import { QuestionOfTheDayGame } from "./QuestionOfTheDayGame";
import { StoryChainGame } from "./StoryChainGame";
import { RateThisGame } from "./RateThisGame";
import { TicTacToeGame } from "./TicTacToeGame";
import { CheckersGame } from "./CheckersGame";
import { ConnectFourGame } from "./ConnectFourGame";
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
      console.log('Loading game:', gameId);
      const data = await getGame(gameId);
      console.log('Game data received:', data);
      setGame(data.game);
      setParticipants(data.participants);
      setEvents(data.events);
    } catch (error: any) {
      console.error('Failed to load game:', error);
      notify(`Failed to load game: ${error.message}`);
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
    case 'tic_tac_toe':
      return (
        <TicTacToeGame
          gameId={gameId}
          title={game.title}
          metadata={game.metadata}
          userId={userId}
          onMove={(row, col) => {
            const newBoard = game.metadata.board.map((r: any[]) => [...r]);
            const currentPlayer = game.metadata.nextTurnUserId === userId ? 
              (game.metadata.board.flat().filter((c: any) => c === 'X').length <= game.metadata.board.flat().filter((c: any) => c === 'O').length ? 'X' : 'O') :
              (game.metadata.board.flat().filter((c: any) => c === 'X').length > game.metadata.board.flat().filter((c: any) => c === 'O').length ? 'X' : 'O');
            
            newBoard[row][col] = currentPlayer;
            
            const checkWinner = () => {
              for (let i = 0; i < 3; i++) {
                if (newBoard[i][0] && newBoard[i][0] === newBoard[i][1] && newBoard[i][1] === newBoard[i][2]) return true;
                if (newBoard[0][i] && newBoard[0][i] === newBoard[1][i] && newBoard[1][i] === newBoard[2][i]) return true;
              }
              if (newBoard[0][0] && newBoard[0][0] === newBoard[1][1] && newBoard[1][1] === newBoard[2][2]) return true;
              if (newBoard[0][2] && newBoard[0][2] === newBoard[1][1] && newBoard[1][1] === newBoard[2][0]) return true;
              return false;
            };

            const winner = checkWinner();
            const allParticipants = participants.filter(p => p.user_id !== userId);
            const otherPlayer = allParticipants.length > 0 ? allParticipants[0].user_id : userId;

            handleAction('move', { row, col }, winner ? 'finished' : undefined, {
              board: newBoard,
              nextTurnUserId: otherPlayer,
              winnerUserId: winner ? userId : null,
            });
          }}
          isFinished={game.status === 'finished'}
        />
      );

    case 'checkers':
      return (
        <CheckersGame
          gameId={gameId}
          title={game.title}
          metadata={game.metadata}
          userId={userId}
          onMove={(fromRow, fromCol, toRow, toCol) => {
            handleAction('move', { fromRow, fromCol, toRow, toCol });
          }}
          isFinished={game.status === 'finished'}
        />
      );

    case 'connect_four':
      return (
        <ConnectFourGame
          gameId={gameId}
          title={game.title}
          metadata={game.metadata}
          userId={userId}
          onDrop={(col) => {
            const newBoard = game.metadata.board.map((r: any[]) => [...r]);
            for (let row = 5; row >= 0; row--) {
              if (!newBoard[row][col]) {
                newBoard[row][col] = game.metadata.currentTurn === 'red' ? 'R' : 'Y';
                
                const checkWin = (r: number, c: number, player: 'R' | 'Y') => {
                  const directions = [[0,1], [1,0], [1,1], [1,-1]];
                  for (const [dr, dc] of directions) {
                    let count = 1;
                    for (let i = 1; i < 4; i++) {
                      if (newBoard[r + dr*i]?.[c + dc*i] === player) count++;
                      else break;
                    }
                    for (let i = 1; i < 4; i++) {
                      if (newBoard[r - dr*i]?.[c - dc*i] === player) count++;
                      else break;
                    }
                    if (count >= 4) return true;
                  }
                  return false;
                };

                const winner = checkWin(row, col, newBoard[row][col]);

                handleAction('drop', { col }, winner ? 'finished' : undefined, {
                  board: newBoard,
                  currentTurn: game.metadata.currentTurn === 'red' ? 'yellow' : 'red',
                  redPlayer: game.metadata.redPlayer,
                  yellowPlayer: game.metadata.yellowPlayer,
                  winnerUserId: winner ? userId : null,
                });
                break;
              }
            }
          }}
          isFinished={game.status === 'finished'}
        />
      );

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
      return <div>Unknown game type: {game.type}</div>;
  }
};
