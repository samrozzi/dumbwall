import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChessMetadata } from "@/types/games";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { Chess, Square } from "chess.js";
import { cn } from "@/lib/utils";

interface ChessGameProps {
  gameId: string;
  title: string | null;
  metadata: ChessMetadata;
  userId: string;
  participants: Array<{
    user_id: string;
    profiles: {
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    };
  }>;
  onMove: (from: string, to: string, promotion?: string) => void;
  onRematch: () => void;
  isFinished: boolean;
  isCreatingRematch: boolean;
}

// Chess piece Unicode symbols
const PIECE_SYMBOLS: Record<string, string> = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export const ChessGame = ({
  title,
  metadata,
  userId,
  participants,
  onMove,
  onRematch,
  isFinished,
  isCreatingRematch,
}: ChessGameProps) => {
  const [chess] = useState(() => new Chess(metadata.fen));
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [promotionDialog, setPromotionDialog] = useState<{
    from: string;
    to: string;
  } | null>(null);

  const isWhite = metadata.whitePlayer === userId;
  const isBlack = metadata.blackPlayer === userId;
  const isMyTurn =
    (metadata.currentTurn === 'white' && isWhite) ||
    (metadata.currentTurn === 'black' && isBlack);

  const winner = metadata.winnerUserId;
  const gameOver = metadata.gameStatus === 'checkmate' || metadata.gameStatus === 'stalemate' || metadata.gameStatus === 'draw';

  // Update chess instance when FEN changes
  useEffect(() => {
    chess.load(metadata.fen);
  }, [metadata.fen, chess]);

  const winnerProfile = winner
    ? participants.find(p => p.user_id === winner)?.profiles
    : null;

  const whiteProfile = participants.find(
    p => p.user_id === metadata.whitePlayer
  )?.profiles;

  const blackProfile = participants.find(
    p => p.user_id === metadata.blackPlayer
  )?.profiles;

  const handleSquareClick = (square: string) => {
    console.log('🎯 Chess square clicked:', square);
    console.log('📊 State:', { 
      selectedSquare, 
      legalMoves, 
      isMyTurn, 
      isFinished, 
      gameOver,
      currentTurn: metadata.currentTurn 
    });
    
    if (!isMyTurn || isFinished || gameOver) {
      console.log('❌ Move blocked:', { isMyTurn, isFinished, gameOver });
      return;
    }

    // If no square is selected, select this one if it has our piece
    if (!selectedSquare) {
      const piece = chess.get(square as Square);
      console.log('🎲 No selection, checking piece:', piece);
      if (piece &&
        ((metadata.currentTurn === 'white' && piece.color === 'w') ||
         (metadata.currentTurn === 'black' && piece.color === 'b'))) {
        console.log('✅ Selecting square:', square);
        setSelectedSquare(square);
        const moves = chess.moves({ square: square as Square, verbose: true });
        setLegalMoves(moves.map(m => m.to));
        console.log('📍 Legal moves:', moves.map(m => m.to));
      }
      return;
    }

    // If clicking the same square, deselect
    if (selectedSquare === square) {
      console.log('🔄 Deselecting square');
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    // If clicking a legal move, make the move
    if (legalMoves.includes(square)) {
      console.log('♟️ Legal move detected! From:', selectedSquare, 'To:', square);
      const piece = chess.get(selectedSquare as Square);

      // Check for pawn promotion
      if (piece?.type === 'p' &&
        ((piece.color === 'w' && square[1] === '8') ||
         (piece.color === 'b' && square[1] === '1'))) {
        console.log('👑 Pawn promotion required');
        setPromotionDialog({ from: selectedSquare, to: square });
        return;
      }

      console.log('🚀 Calling onMove:', selectedSquare, '->', square);
      onMove(selectedSquare, square);
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }
    
    // Try to select the new square
    console.log('🔍 Trying to select new square:', square);
    const piece = chess.get(square as Square);
    if (piece &&
      ((metadata.currentTurn === 'white' && piece.color === 'w') ||
       (metadata.currentTurn === 'black' && piece.color === 'b'))) {
      console.log('✅ Selecting new square:', square);
      setSelectedSquare(square);
      const moves = chess.moves({ square: square as Square, verbose: true });
      setLegalMoves(moves.map(m => m.to));
      console.log('📍 Legal moves:', moves.map(m => m.to));
    } else {
      console.log('❌ Invalid square selection');
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const handlePromotion = (piece: string) => {
    if (promotionDialog) {
      onMove(promotionDialog.from, promotionDialog.to, piece);
      setPromotionDialog(null);
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const getPieceAt = (square: string) => {
    const piece = chess.get(square as Square);
    if (!piece) return null;

    const symbol = piece.type.toUpperCase();
    return piece.color === 'w' ? PIECE_SYMBOLS[symbol] : PIECE_SYMBOLS[symbol.toLowerCase()];
  };

  const isSquareLight = (file: number, rank: number) => {
    return (file + rank) % 2 === 0;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title || "Chess"}</span>
          <div className="flex items-center gap-2">
            {metadata.gameStatus === 'check' && (
              <Badge variant="destructive">Check!</Badge>
            )}
            {metadata.isComputerOpponent && (
              <Badge variant="secondary">vs Computer</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Winner/Game Over Display */}
        {(winner || gameOver) && (
          <div className="text-center space-y-3 pb-4 border-b">
            {winner && winnerProfile && (
              <>
                <Avatar className="h-16 w-16 mx-auto">
                  <AvatarImage src={winnerProfile.avatar_url || ""} />
                  <AvatarFallback>
                    {winnerProfile.display_name?.[0] || winnerProfile.username?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">
                    {winnerProfile.display_name || `@${winnerProfile.username}`}
                  </p>
                  <p className="text-primary text-xl font-bold">
                    {winner === userId ? "You won! 🎉" : "Wins! 🎉"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {metadata.gameStatus === 'checkmate' ? 'Checkmate' : metadata.gameStatus}
                  </p>
                </div>
              </>
            )}
            {gameOver && !winner && (
              <div>
                <p className="text-muted-foreground text-lg font-semibold">
                  {metadata.gameStatus === 'stalemate' ? 'Stalemate' : 'Draw'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Game Over</p>
              </div>
            )}
          </div>
        )}

        {/* Players Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {blackProfile && (
              <>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={blackProfile.avatar_url || ""} />
                  <AvatarFallback className="text-xs">
                    {blackProfile.display_name?.[0] || blackProfile.username?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="font-medium flex items-center gap-1">
                    ♟️ Black
                    {metadata.currentTurn === 'black' && !gameOver && (
                      <Badge variant="outline" className="ml-1 h-5">Turn</Badge>
                    )}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {blackProfile.display_name || `@${blackProfile.username}`}
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {whiteProfile && (
              <>
                <div className="text-sm text-right">
                  <div className="font-medium flex items-center justify-end gap-1">
                    {metadata.currentTurn === 'white' && !gameOver && (
                      <Badge variant="outline" className="mr-1 h-5">Turn</Badge>
                    )}
                    White ♙
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {whiteProfile.display_name || `@${whiteProfile.username}`}
                  </div>
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={whiteProfile.avatar_url || ""} />
                  <AvatarFallback className="text-xs">
                    {whiteProfile.display_name?.[0] || whiteProfile.username?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
              </>
            )}
          </div>
        </div>

        {/* Chess Board */}
        <div className="w-full max-w-[500px] mx-auto">
          <div className="aspect-square bg-gradient-to-br from-slate-800 to-slate-900 p-3 rounded-lg border-2 border-purple-500/20 shadow-xl">
            <div className="grid grid-cols-8 gap-0 w-full h-full rounded-sm shadow-lg">
              {RANKS.map((rank, rankIdx) =>
                FILES.map((file, fileIdx) => {
                  const square = `${file}${rank}`;
                  const isLight = isSquareLight(fileIdx, rankIdx);
                  const isSelected = selectedSquare === square;
                  const isLegalMove = legalMoves.includes(square);
                  const piece = getPieceAt(square);

                  return (
                <button
                  key={square}
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleSquareClick(square);
                  }}
                  disabled={!isMyTurn || isFinished || gameOver}
                  className={cn(
                        "relative flex items-center justify-center text-4xl font-bold transition-all",
                        "active:scale-95 disabled:cursor-not-allowed min-h-[44px] touch-none select-none",
                        isLight
                          ? "bg-slate-600 hover:bg-slate-500" 
                          : "bg-slate-800 hover:bg-slate-700",
                        isSelected && "ring-4 ring-purple-500 ring-inset brightness-125",
                        isLegalMove && "ring-2 ring-purple-400 ring-inset",
                        piece && piece.match(/[♔♕♖♗♘♙]/) && "text-slate-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]",
                        piece && piece.match(/[♚♛♜♝♞♟]/) && "text-slate-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.3)]"
                      )}
                    >
                      {piece}
                      {isLegalMove && !piece && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-3 h-3 rounded-full bg-purple-500/60 shadow-lg" />
                        </div>
                      )}
                      {isLegalMove && piece && (
                        <div className="absolute inset-0 bg-purple-500/20 pointer-events-none" />
                      )}
                      {/* Coordinate labels */}
                      {fileIdx === 0 && (
                        <span className="absolute left-1 top-0.5 text-[10px] font-mono text-purple-300/70 select-none">
                          {rank}
                        </span>
                      )}
                      {rankIdx === 7 && (
                        <span className="absolute right-1 bottom-0.5 text-[10px] font-mono text-purple-300/70 select-none">
                          {file}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Turn Indicator */}
        {!isFinished && !gameOver && (
          <div className="text-center text-sm">
            {isMyTurn ? (
              <Badge className="bg-primary">Your turn</Badge>
            ) : (
              <span className="text-muted-foreground">Opponent's turn</span>
            )}
          </div>
        )}

        {/* Move History */}
        {metadata.moveHistory.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Move History</h3>
            <ScrollArea className="h-[100px]">
              <div className="grid grid-cols-2 gap-2 text-sm pr-4">
                {metadata.moveHistory.map((move, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-muted-foreground">{Math.floor(idx / 2) + 1}.</span>
                    <span className="font-mono">{move}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Promotion Dialog */}
        {promotionDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Choose promotion piece</h3>
              <div className="grid grid-cols-4 gap-2">
                {['q', 'r', 'b', 'n'].map((piece) => {
                  const symbol = metadata.currentTurn === 'white'
                    ? PIECE_SYMBOLS[piece.toUpperCase()]
                    : PIECE_SYMBOLS[piece];
                  return (
                    <Button
                      key={piece}
                      onClick={() => handlePromotion(piece)}
                      variant="outline"
                      className="h-16 text-4xl"
                    >
                      {symbol}
                    </Button>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* Rematch Button */}
        {(isFinished || gameOver) && (
          <Button 
            onClick={onRematch} 
            disabled={isCreatingRematch}
            className="w-full"
          >
            {isCreatingRematch ? "Creating..." : "Play Again"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
