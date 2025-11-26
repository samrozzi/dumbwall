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

// Minimal chess piece SVG component matching reference design
const ChessPiece = ({ type, color }: { type: string; color: 'w' | 'b' }) => {
  // Minimal rounded Staunton-like silhouettes
  const pieces: Record<string, JSX.Element> = {
    'k': ( // King - crown with cross
      <svg viewBox="0 0 45 45" className="piece-svg">
        <path d="M22.5 11.63V6M20 8h5M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5zM11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10V37z" />
      </svg>
    ),
    'q': ( // Queen - crown with multiple points
      <svg viewBox="0 0 45 45" className="piece-svg">
        <path d="M9 26c2.5-2.5 4-4 6.5-5.5 2.5-1.5 3.5 1 5.5 1s3-2.5 5.5-1c2.5 1.5 4 3 6.5 5.5 2.5 2.5 2.5 4 2.5 7.5V38H6.5v-4.5c0-3.5 0-5 2.5-7.5z" />
        <circle cx="9" cy="26" r="2" />
        <circle cx="15" cy="20" r="2" />
        <circle cx="22.5" cy="18" r="2" />
        <circle cx="30" cy="20" r="2" />
        <circle cx="36" cy="26" r="2" />
      </svg>
    ),
    'r': ( // Rook - castle tower
      <svg viewBox="0 0 45 45" className="piece-svg">
        <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5H11z" />
        <path d="M34 14l-3 3H14l-3-3v-3h23v3z" />
        <path d="M31 17v12.5H14V17h17z" />
        <path d="M13 29.5h19V32H13v-2.5z" />
      </svg>
    ),
    'b': ( // Bishop - mitre with rounded top
      <svg viewBox="0 0 45 45" className="piece-svg">
        <path d="M22.5 9c-2 0-3.5 1.5-3.5 3.5s1.5 3.5 3.5 3.5 3.5-1.5 3.5-3.5S24.5 9 22.5 9z" />
        <path d="M22.5 16c-2 2-8 8-8 13 0 3 1.5 5 4 6h8c2.5-1 4-3 4-6 0-5-6-11-8-13z" />
        <path d="M12 35.5h21v2.5H12v-2.5z" />
      </svg>
    ),
    'n': ( // Knight - horse head profile
      <svg viewBox="0 0 45 45" className="piece-svg">
        <path d="M22 10c-2 0-4 2-5 4-1 2-1 4-1 6v3c0 3 2 5 4 6l-2 8h4l2-8c3-1 5-3 5-6v-3c0-2 0-4-1-6-1-2-3-4-6-4z" />
        <circle cx="25" cy="15" r="1.5" />
        <path d="M11 36c3 1 8 2 14 2s11-1 14-2c0-2-4-4-14-4s-14 2-14 4z" />
      </svg>
    ),
    'p': ( // Pawn - simple rounded figure
      <svg viewBox="0 0 45 45" className="piece-svg">
        <circle cx="22.5" cy="12" r="4.5" />
        <path d="M22.5 17c-3 0-5 2-5 5v5c0 2 1.5 3.5 3.5 3.5h3c2 0 3.5-1.5 3.5-3.5v-5c0-3-2-5-5-5z" />
        <path d="M13 32h19v4H13v-4z" />
      </svg>
    )
  };

  return (
    <div className={`chess-piece ${color === 'w' ? 'white' : 'black'}`}>
      {pieces[type.toLowerCase()]}
    </div>
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

        {/* Premium Chess Board with Dark Navy Aesthetic */}
        <div className="w-full mx-auto">
          <div className="chess-board-frame">
            <div className="chess-board-grid">
              {RANKS.map((rank, rankIdx) =>
                FILES.map((file, fileIdx) => {
                  const square = `${file}${rank}`;
                  const isLight = isSquareLight(fileIdx, rankIdx);
                  const isSelected = selectedSquare === square;
                  const isLegalMove = legalMoves.includes(square);
                  const piece = getPieceAt(square);
                  
                  // Check if this is part of last move (derive from move history and board state)
                  const isLastMove = false; // Remove this feature for now since we don't track from/to squares directly
                  
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
                        "chess-square relative transition-all duration-150",
                        "active:scale-95 min-h-[44px] touch-manipulation select-none",
                        (!isMyTurn || isFinished || gameOver) && "cursor-not-allowed",
                        isLight ? "light" : "dark",
                        isSelected && "selected",
                        isLastMove && "last-move"
                      )}
                    >
                      {/* Legal move indicators */}
                      {isLegalMove && !piece && (
                        <div className="legal-dot" />
                      )}
                      {isLegalMove && piece && (
                        <div className="capture-dot" />
                      )}
                      
                      {/* Chess piece */}
                      {piece && !isAnimatingFrom && (
                        <div 
                          className="absolute inset-[8%]" 
                          style={isAnimatingTo ? animationStyle : {}}
                        >
                          <ChessPiece type={piece.type} color={piece.color} />
                        </div>
                      )}
                      
                      {/* Coordinate labels */}
                      {fileIdx === 0 && (
                        <span className="chess-coordinate chess-coordinate-rank">
                          {rank}
                        </span>
                      )}
                      {rankIdx === 7 && (
                        <span className="chess-coordinate chess-coordinate-file">
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