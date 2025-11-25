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

// Custom SVG chess piece component with Liquid Glass styling
const ChessPiece = ({ type, color }: { type: string; color: 'w' | 'b' }) => {
  const isWhite = color === 'w';
  const baseColor = isWhite ? 'rgba(255, 255, 255, 0.95)' : 'rgba(30, 41, 59, 0.95)';
  const strokeColor = isWhite ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.4)';
  const glowColor = isWhite ? 'rgba(167, 139, 250, 0.5)' : 'rgba(139, 92, 246, 0.5)';

  // Proper, recognizable chess piece SVG paths
  const paths: Record<string, string> = {
    // King - Crown with cross on top
    'k': 'M12 2l-1 2h2l-1-2zm-1 3v1h2V5h-1zm-3 2h8l-1 3v4l1 2v2H7v-2l1-2V10l-1-3zm1 9h6v2H9v-2z',
    // Queen - Crown with multiple points
    'q': 'M6 6l1.5 2 1.5-2 1.5 2L12 6l1.5 2 1.5-2 1.5 2L18 6l-1 4v3l1 2v2H6v-2l1-2v-3L6 6zm2 11h8v2H8v-2z',
    // Rook - Castle tower
    'r': 'M7 5h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zM7 8h10v5c0 1.5-1 2.5-2.5 2.5h-5C8 15.5 7 14.5 7 13V8zm0 9h10v2H7v-2z',
    // Bishop - Mitre with circle on top
    'b': 'M12 3c-.5 0-1 .5-1 1s.5 1 1 1 1-.5 1-1-.5-1-1-1zm-2 3l2 3 2-3 1 5v2l1 2v2H8v-2l1-2v-2l1-5zm-2 12h8v2H8v-2z',
    // Knight - Horse head
    'n': 'M14 4c-1 0-2 1-2 2 0 .5.2 1 .5 1.3L11 9c-.5.8-1 1.5-1 2.5V13l1 2v2l1 1H8v-2l1-2v-1.5c0-1.5 1-3 2-4l1.5-2C12 6.3 12 6 12 6c0-.5.5-1 1-1h1c.5 0 1 .5 1 1l-1 2zm-6 14h8v2H8v-2z',
    // Pawn - Simple rounded figure
    'p': 'M12 5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-2 5c-.5 0-1 .5-1 1v2c0 1 .5 2 1.5 2h3c1 0 1.5-1 1.5-2v-2c0-.5-.5-1-1-1h-4zm-1 7h6v2H9v-2z'
  };

  return (
    <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-lg">
      <defs>
        <filter id={`glow-${color}-${type}`}>
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id={`grad-${color}-${type}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: baseColor, stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: isWhite ? 'rgba(226, 232, 240, 0.95)' : 'rgba(15, 23, 42, 0.95)', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <path
        d={paths[type.toLowerCase()]}
        fill={`url(#grad-${color}-${type})`}
        stroke={strokeColor}
        strokeWidth="0.8"
        strokeLinejoin="round"
        strokeLinecap="round"
        filter={`url(#glow-${color}-${type})`}
        style={{ filter: `drop-shadow(0 3px 6px ${glowColor})` }}
      />
    </svg>
  );
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
  const [animatingMove, setAnimatingMove] = useState<{
    from: string;
    to: string;
    piece: { type: string; color: 'w' | 'b' };
  } | null>(null);

  const isWhite = metadata.whitePlayer === userId;
  const isBlack = metadata.blackPlayer === userId;
  const isMyTurn =
    (metadata.currentTurn === 'white' && isWhite) ||
    (metadata.currentTurn === 'black' && isBlack);

  const winner = metadata.winnerUserId;
  const gameOver = metadata.gameStatus === 'checkmate' || metadata.gameStatus === 'stalemate' || metadata.gameStatus === 'draw';

  // Update chess instance when FEN changes and trigger animation
  useEffect(() => {
    const prevFen = chess.fen();
    chess.load(metadata.fen);
    
    // Detect the move by comparing FENs
    if (metadata.moveHistory.length > 0 && prevFen !== metadata.fen) {
      const lastMoveStr = metadata.moveHistory[metadata.moveHistory.length - 1];
      // Parse algebraic notation to get from/to squares
      // For simplicity, we'll track the last two positions that changed
      const prevBoard = new Chess(prevFen);
      const currBoard = new Chess(metadata.fen);
      
      // Find which piece moved by comparing boards
      let fromSquare = '';
      let toSquare = '';
      let movedPiece = null;
      
      for (let rank of RANKS) {
        for (let file of FILES) {
          const sq = `${file}${rank}` as Square;
          const prevPiece = prevBoard.get(sq);
          const currPiece = currBoard.get(sq);
          
          if (prevPiece && !currPiece) {
            fromSquare = sq;
            movedPiece = prevPiece;
          } else if (!prevPiece && currPiece && movedPiece && 
                     currPiece.type === movedPiece.type && 
                     currPiece.color === movedPiece.color) {
            toSquare = sq;
          }
        }
      }
      
      if (fromSquare && toSquare && movedPiece) {
        setAnimatingMove({
          from: fromSquare,
          to: toSquare,
          piece: { type: movedPiece.type, color: movedPiece.color }
        });
        
        // Clear animation after it completes
        setTimeout(() => {
          setAnimatingMove(null);
        }, 300);
      }
    }
  }, [metadata.fen, chess, metadata.moveHistory]);

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
    if (!isMyTurn || isFinished || gameOver) return;

    // If no square is selected, select this one if it has our piece
    if (!selectedSquare) {
      const piece = chess.get(square as Square);
      if (piece &&
        ((metadata.currentTurn === 'white' && piece.color === 'w') ||
         (metadata.currentTurn === 'black' && piece.color === 'b'))) {
        setSelectedSquare(square);
        const moves = chess.moves({ square: square as Square, verbose: true });
        setLegalMoves(moves.map(m => m.to));
      }
      return;
    }

    // If clicking the same square, deselect
    if (selectedSquare === square) {
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    // If clicking a legal move, make the move
    if (legalMoves.includes(square)) {
      const piece = chess.get(selectedSquare as Square);

      // Check for pawn promotion
      if (piece?.type === 'p' &&
        ((piece.color === 'w' && square[1] === '8') ||
         (piece.color === 'b' && square[1] === '1'))) {
        setPromotionDialog({ from: selectedSquare, to: square });
        return;
      }

      onMove(selectedSquare, square);
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }
    
    // Try to select the new square
    const piece = chess.get(square as Square);
    if (piece &&
      ((metadata.currentTurn === 'white' && piece.color === 'w') ||
       (metadata.currentTurn === 'black' && piece.color === 'b'))) {
      setSelectedSquare(square);
      const moves = chess.moves({ square: square as Square, verbose: true });
      setLegalMoves(moves.map(m => m.to));
    } else {
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
    return { type: piece.type, color: piece.color };
  };

  const isSquareLight = (file: number, rank: number) => {
    return (file + rank) % 2 === 0;
  };

  // Format move history properly (pair white and black moves)
  const formattedMoves = [];
  for (let i = 0; i < metadata.moveHistory.length; i += 2) {
    const moveNum = Math.floor(i / 2) + 1;
    const whiteMove = metadata.moveHistory[i];
    const blackMove = metadata.moveHistory[i + 1];
    formattedMoves.push({
      moveNum,
      white: whiteMove,
      black: blackMove || ''
    });
  }

  return (
    <Card className="w-full border-2 border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
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
      <CardContent className="space-y-6">
        {/* Winner/Game Over Display */}
        {(winner || gameOver) && (
          <div className="text-center space-y-3 pb-4 border-b border-border/50">
            {winner && winnerProfile && (
              <>
                <Avatar className="h-16 w-16 mx-auto ring-4 ring-primary/30">
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

        {/* Turn Indicator - Moved to top for mobile visibility */}
        {!isFinished && !gameOver && (
          <div className="text-center">
            {isMyTurn ? (
              <Badge className="bg-primary text-primary-foreground px-6 py-2 text-base">Your turn</Badge>
            ) : (
              <span className="text-muted-foreground">Opponent's turn</span>
            )}
          </div>
        )}

        {/* Players Info */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            {blackProfile && (
              <>
                <Avatar className="h-10 w-10 ring-2 ring-slate-700">
                  <AvatarImage src={blackProfile.avatar_url || ""} />
                  <AvatarFallback className="text-xs bg-slate-800 text-white">
                    {blackProfile.display_name?.[0] || blackProfile.username?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="font-medium flex items-center gap-1">
                    <span className="text-slate-800">⬤</span> Black
                    {metadata.currentTurn === 'black' && !gameOver && (
                      <Badge variant="outline" className="ml-1 h-5 text-xs">Turn</Badge>
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
                      <Badge variant="outline" className="mr-1 h-5 text-xs">Turn</Badge>
                    )}
                    White <span className="text-white">⬤</span>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {whiteProfile.display_name || `@${whiteProfile.username}`}
                  </div>
                </div>
                <Avatar className="h-10 w-10 ring-2 ring-slate-200">
                  <AvatarImage src={whiteProfile.avatar_url || ""} />
                  <AvatarFallback className="text-xs bg-slate-50 text-slate-900">
                    {whiteProfile.display_name?.[0] || whiteProfile.username?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
              </>
            )}
          </div>
        </div>

        {/* Liquid Glass Chess Board */}
        <div className="w-full mx-auto">
          <div className="aspect-square bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 p-2 sm:p-4 rounded-2xl border-2 border-primary/30 shadow-2xl backdrop-blur-sm">
            <div className="grid grid-cols-8 gap-0 w-full h-full rounded-xl overflow-hidden shadow-inner relative">
              {/* Frosted glass overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-xl" />
              
              {RANKS.map((rank, rankIdx) =>
                FILES.map((file, fileIdx) => {
                  const square = `${file}${rank}`;
                  const isLight = isSquareLight(fileIdx, rankIdx);
                  const isSelected = selectedSquare === square;
                  const isLegalMove = legalMoves.includes(square);
                  const piece = getPieceAt(square);
                  
                  // Check if this square has the animating piece
                  const isAnimatingFrom = animatingMove?.from === square;
                  const isAnimatingTo = animatingMove?.to === square;
                  
                  // Calculate animation transform
                  let animationStyle = {};
                  if (isAnimatingTo && animatingMove) {
                    const fromFile = FILES.indexOf(animatingMove.from[0]);
                    const fromRank = RANKS.indexOf(animatingMove.from[1]);
                    const toFile = fileIdx;
                    const toRank = rankIdx;
                    const deltaX = (fromFile - toFile) * 100;
                    const deltaY = (fromRank - toRank) * 100;
                    
                    animationStyle = {
                      animation: 'slideIn 300ms ease-out',
                      '--slide-from-x': `${deltaX}%`,
                      '--slide-from-y': `${deltaY}%`,
                    } as React.CSSProperties;
                  }

                  return (
                    <button
                      key={square}
                      type="button"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        handleSquareClick(square);
                      }}
                      onContextMenu={(e) => e.preventDefault()}
                      className={cn(
                        "relative flex items-center justify-center transition-all duration-200",
                        "active:scale-95 min-h-[44px] touch-manipulation select-none",
                        (!isMyTurn || isFinished || gameOver) && "cursor-not-allowed",
                        isLight
                          ? "bg-white/20 backdrop-blur-sm hover:bg-white/30" 
                          : "bg-slate-900/40 backdrop-blur-sm hover:bg-slate-900/50",
                        isSelected && "ring-4 ring-primary ring-inset bg-primary/20 shadow-lg",
                        isLegalMove && "ring-2 ring-accent ring-inset shadow-accent/50"
                      )}
                    >
                      {piece && !isAnimatingFrom && (
                        <div 
                          className="w-[85%] h-[85%]" 
                          style={isAnimatingTo ? animationStyle : {}}
                        >
                          <ChessPiece type={piece.type} color={piece.color} />
                        </div>
                      )}
                      {isLegalMove && !piece && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-3 h-3 rounded-full bg-accent/70 shadow-lg shadow-accent/50 animate-pulse" />
                        </div>
                      )}
                      {isLegalMove && piece && (
                        <div className="absolute inset-0 bg-accent/20 pointer-events-none ring-2 ring-accent/60 ring-inset" />
                      )}
                      {/* Coordinate labels */}
                      {fileIdx === 0 && (
                        <span className="absolute left-0.5 sm:left-1 top-0.5 text-[8px] sm:text-[10px] font-mono text-primary/60 select-none font-semibold">
                          {rank}
                        </span>
                      )}
                      {rankIdx === 7 && (
                        <span className="absolute right-0.5 sm:right-1 bottom-0.5 text-[8px] sm:text-[10px] font-mono text-primary/60 select-none font-semibold">
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

        {/* Move History */}
        {formattedMoves.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <span>Move History</span>
              <Badge variant="secondary" className="text-xs">{metadata.moveHistory.length}</Badge>
            </h3>
            <ScrollArea className="h-[120px] rounded-lg border border-border/50 bg-muted/20 p-3">
              <div className="space-y-1">
                {formattedMoves.map((move) => (
                  <div key={move.moveNum} className="flex items-center gap-3 text-sm font-mono">
                    <span className="text-muted-foreground font-semibold w-6">{move.moveNum}.</span>
                    <span className="flex-1 text-foreground">{move.white}</span>
                    {move.black && (
                      <span className="flex-1 text-foreground">{move.black}</span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Promotion Dialog */}
        {promotionDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <Card className="p-6 border-2 border-primary/30 shadow-2xl">
              <h3 className="font-semibold mb-4 text-center">Choose promotion piece</h3>
              <div className="grid grid-cols-4 gap-2">
                {['q', 'r', 'b', 'n'].map((pieceType) => {
                  return (
                    <Button
                      key={pieceType}
                      onClick={() => handlePromotion(pieceType)}
                      variant="outline"
                      className="h-20 w-20 p-2 hover:bg-primary/10 hover:border-primary"
                    >
                      <ChessPiece 
                        type={pieceType} 
                        color={metadata.currentTurn === 'white' ? 'w' : 'b'} 
                      />
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
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isCreatingRematch ? "Creating..." : "Play Again"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};