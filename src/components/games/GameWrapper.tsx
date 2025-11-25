import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGameAPI } from "@/hooks/useGameAPI";
import { Game, GameEvent, GameParticipant } from "@/types/games";
import { supabase } from "@/integrations/supabase/client";
import { getTicTacToeAIMove, getConnectFourAIMove, getCheckersAIMove } from "@/lib/gameAI";
import { PollGame } from "./PollGame";
import { WouldYouRatherGame } from "./WouldYouRatherGame";
import { QuestionOfTheDayGame } from "./QuestionOfTheDayGame";
import { StoryChainGame } from "./StoryChainGame";
import { RateThisGame } from "./RateThisGame";
import { TicTacToeGame } from "./TicTacToeGame";
import { CheckersGame } from "./CheckersGame";
import { ConnectFourGame } from "./ConnectFourGame";
import { HangmanGame } from "./HangmanGame";
import { ChessGame } from "./ChessGame";
import { TwentyOneQuestionsGame } from "./TwentyOneQuestionsGame";
import { notify } from "@/components/ui/custom-notification";

interface GameWrapperProps {
  gameId: string;
  userId: string;
}

export const GameWrapper = ({ gameId, userId }: GameWrapperProps) => {
  const [game, setGame] = useState<Game | null>(null);
  const [optimisticGame, setOptimisticGame] = useState<Game | null>(null);
  const [participants, setParticipants] = useState<GameParticipant[]>([]);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { getGame, joinGame, gameAction, createGame } = useGameAPI();
  const navigate = useNavigate();
  const computerMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadGame();
    setupRealtime();
  }, [gameId]);

  // Computer move triggering
  useEffect(() => {
    if (!game || game.status === 'finished' || !game.metadata.isComputerOpponent) return;

    // Clear any existing timeout
    if (computerMoveTimeoutRef.current) {
      clearTimeout(computerMoveTimeoutRef.current);
    }

    const makeComputerMove = async () => {
      try {
        switch (game.type) {
          case 'tic_tac_toe':
            // Check if it's computer's turn
            if (game.metadata.nextTurnUserId === 'computer' && game.status === 'in_progress') {
              const aiMove = getTicTacToeAIMove(
                game.metadata.board,
                game.metadata.difficulty || 'medium',
                game.metadata.computerSymbol || 'O',
                game.metadata.playerSymbol || 'X'
              );

              if (aiMove) {
                const newBoard = game.metadata.board.map((r: any[]) => [...r]);
                newBoard[aiMove.row][aiMove.col] = game.metadata.computerSymbol || 'O';

                // Check winner
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

                await gameAction(gameId, 'move', { row: aiMove.row, col: aiMove.col }, winner ? 'finished' : undefined, {
                  ...game.metadata,
                  board: newBoard,
                  nextTurnUserId: userId,
                  winnerUserId: winner ? 'computer' : null,
                });
              }
            }
            break;

          case 'connect_four':
            if (game.metadata.yellowPlayer === 'computer' && game.metadata.currentTurn === 'yellow' && game.status === 'in_progress') {
              const aiCol = getConnectFourAIMove(
                game.metadata.board,
                game.metadata.difficulty || 'medium',
                'Y'
              );

              if (aiCol !== null) {
                const newBoard = game.metadata.board.map((r: any[]) => [...r]);
                let row = -1;
                for (let r = 5; r >= 0; r--) {
                  if (!newBoard[r][aiCol]) {
                    newBoard[r][aiCol] = 'Y';
                    row = r;
                    break;
                  }
                }

                if (row !== -1) {
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

                  const winner = checkWin(row, aiCol, 'Y');

                  await gameAction(gameId, 'drop', { col: aiCol }, winner ? 'finished' : undefined, {
                    ...game.metadata,
                    board: newBoard,
                    currentTurn: 'red',
                    winnerUserId: winner ? 'computer' : null,
                  });
                }
              }
            }
            break;

          case 'checkers':
            if (game.metadata.blackPlayer === 'computer' && game.metadata.currentTurn === 'black' && game.status === 'in_progress') {
              const aiMove = getCheckersAIMove(
                game.metadata.board,
                game.metadata.difficulty || 'medium',
                'black'
              );

              if (aiMove) {
                await gameAction(gameId, 'move', {
                  fromRow: aiMove.from.row,
                  fromCol: aiMove.from.col,
                  toRow: aiMove.to.row,
                  toCol: aiMove.to.col,
                });
              }
            }
            break;
        }
      } catch (error) {
        console.error('Computer move error:', error);
      }
    };

    // Delay computer move for better UX (looks like it's "thinking")
    computerMoveTimeoutRef.current = setTimeout(makeComputerMove, 1000);

    return () => {
      if (computerMoveTimeoutRef.current) {
        clearTimeout(computerMoveTimeoutRef.current);
      }
    };
  }, [game, userId, gameId, gameAction]);

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
      setOptimisticGame(null); // Clear optimistic state when real data arrives
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
      // Don't show toast for every action - too noisy
    } catch (error) {
      console.error("Error performing action:", error);
      notify("Error performing action");
    }
  };

  const handleRematch = async () => {
    if (!game) return;
    
    try {
      const newGameId = await createGame(
        game.circle_id,
        game.type,
        game.title || `${game.type} Rematch`,
        game.description,
        game.type === 'tic_tac_toe' 
          ? { board: [[null, null, null], [null, null, null], [null, null, null]], nextTurnUserId: userId, winnerUserId: null }
          : {}
      );
      
      notify("Rematch created!");
      navigate(`/circle/${game.circle_id}/games`);
    } catch (error) {
      console.error("Error creating rematch:", error);
      notify("Error creating rematch");
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

  // Use optimistic game state if available, otherwise use real game
  const displayGame = optimisticGame || game;

  switch (game.type) {
    case 'tic_tac_toe':
      return (
        <TicTacToeGame
          gameId={gameId}
          title={displayGame.title}
          metadata={displayGame.metadata}
          userId={userId}
          participants={participants}
          onMove={(row, col) => {
            const newBoard = game.metadata.board.map((r: any[]) => [...r]);
            
            // Use the stored player symbol
            const playerSymbol = game.metadata.playerSymbol || 'X';
            newBoard[row][col] = playerSymbol;
            
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
            
            // Determine next turn - if computer opponent, set to 'computer', otherwise find other player
            let nextTurnUserId: string;
            if (game.metadata.isComputerOpponent) {
              nextTurnUserId = 'computer';
            } else {
              const otherParticipant = participants.find(p => p.user_id !== userId);
              nextTurnUserId = otherParticipant?.user_id || userId;
            }

            // Optimistic UI update - show the move immediately
            setOptimisticGame({
              ...game,
              metadata: {
                ...game.metadata,
                board: newBoard,
                nextTurnUserId,
                winnerUserId: winner ? userId : null,
              }
            });

            // Send to server - CRITICAL: spread ...game.metadata FIRST so new values override
            handleAction('move', { row, col }, winner ? 'finished' : undefined, {
              ...game.metadata,
              board: newBoard,
              nextTurnUserId,
              winnerUserId: winner ? userId : null,
            });
          }}
          onRematch={handleRematch}
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

    case 'hangman':
      return (
        <HangmanGame
          gameId={gameId}
          title={game.title}
          metadata={game.metadata}
          userId={userId}
          participants={participants}
          onGuess={(letter) => {
            const guessedLetters = [...game.metadata.guessedLetters, letter];
            const isCorrect = game.metadata.word.includes(letter);
            const incorrectGuesses = isCorrect
              ? game.metadata.incorrectGuesses
              : game.metadata.incorrectGuesses + 1;

            // Check if word is complete
            const isWordGuessed = game.metadata.word
              .split("")
              .every((l: string) => guessedLetters.includes(l));

            // Check if game over
            const isGameOver = incorrectGuesses >= game.metadata.maxGuesses;

            const status = isWordGuessed || isGameOver ? 'finished' : undefined;
            const winnerUserId = isWordGuessed ? userId : (isGameOver ? null : undefined);

            handleAction('guess', { letter }, status, {
              ...game.metadata,
              guessedLetters,
              incorrectGuesses,
              winnerUserId,
            });
          }}
          onRematch={handleRematch}
          isFinished={game.status === 'finished'}
        />
      );

    case 'chess':
      return (
        <ChessGame
          gameId={gameId}
          title={game.title}
          metadata={game.metadata}
          userId={userId}
          participants={participants}
          onMove={(from, to, promotion) => {
            const { Chess } = require('chess.js');
            const chess = new Chess(game.metadata.fen);

            const move = chess.move({ from, to, promotion });
            if (!move) {
              notify("Invalid move!");
              return;
            }

            const newFen = chess.fen();
            const newMoveHistory = [...game.metadata.moveHistory, move.san];

            let gameStatus: any = 'active';
            let winnerUserId = null;

            if (chess.isCheckmate()) {
              gameStatus = 'checkmate';
              winnerUserId = userId;
            } else if (chess.isCheck()) {
              gameStatus = 'check';
            } else if (chess.isStalemate()) {
              gameStatus = 'stalemate';
            } else if (chess.isDraw()) {
              gameStatus = 'draw';
            }

            const status = gameStatus === 'checkmate' || gameStatus === 'stalemate' || gameStatus === 'draw'
              ? 'finished'
              : undefined;

            handleAction('move', { from, to, promotion }, status, {
              fen: newFen,
              currentTurn: game.metadata.currentTurn === 'white' ? 'black' : 'white',
              whitePlayer: game.metadata.whitePlayer,
              blackPlayer: game.metadata.blackPlayer,
              moveHistory: newMoveHistory,
              gameStatus,
              winnerUserId,
            });
          }}
          onRematch={handleRematch}
          isFinished={game.status === 'finished'}
        />
      );

    case 'twenty_one_questions':
      return (
        <TwentyOneQuestionsGame
          gameId={gameId}
          title={game.title}
          metadata={game.metadata}
          userId={userId}
          participants={participants}
          onAskQuestion={(question) => {
            const newQuestion = {
              question,
              answer: undefined as any,
              askedBy: userId,
              timestamp: new Date().toISOString(),
            };
            const updatedQuestions = [...game.metadata.questions, newQuestion];
            const currentQuestion = game.metadata.currentQuestion + 1;

            handleAction('ask_question', { question }, undefined, {
              ...game.metadata,
              questions: updatedQuestions,
              currentQuestion,
            });
          }}
          onAnswerQuestion={(answer) => {
            const updatedQuestions = game.metadata.questions.map((q: any, idx: number) =>
              idx === game.metadata.questions.length - 1 ? { ...q, answer } : q
            );

            handleAction('answer_question', { answer }, undefined, {
              ...game.metadata,
              questions: updatedQuestions,
            });
          }}
          onMakeGuess={(guess) => {
            const isCorrect = guess.toLowerCase().trim() === game.metadata.subject.toLowerCase().trim();
            const status = isCorrect || game.metadata.currentQuestion >= game.metadata.maxQuestions
              ? 'finished'
              : undefined;

            handleAction('make_guess', { guess, correct: isCorrect }, status, {
              ...game.metadata,
              winnerUserId: isCorrect ? userId : null,
              correctGuess: isCorrect ? guess : undefined,
            });
          }}
          onRematch={handleRematch}
          isFinished={game.status === 'finished'}
        />
      );

    default:
      return <div>Unknown game type: {game.type}</div>;
  }
};
