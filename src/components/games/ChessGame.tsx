import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChessMetadata } from "@/types/games";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useRef } from "react";
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
  const sideClass = color === 'w' ? 'white' : 'black';
  
  const getPieceSvg = (pieceType: string) => {
    switch (pieceType.toLowerCase()) {
      case 'p':
        return (
          <svg viewBox="0 0 45 45" className="w-full h-full">
            <path d="M 22.5 9 C 19.5 9 17 11.5 17 14.5 C 17 16.5 18 18 19.5 19 C 18.5 19.5 18 20.5 18 21.5 L 18 23 C 18 24 18.5 25 19.5 25.5 L 19.5 31 C 19.5 32 20 33 21 33 L 24 33 C 25 33 25.5 32 25.5 31 L 25.5 25.5 C 26.5 25 27 24 27 23 L 27 21.5 C 27 20.5 26.5 19.5 25.5 19 C 27 18 28 16.5 28 14.5 C 28 11.5 25.5 9 22.5 9 Z M 18 33 C 17 33.5 16 34 16 35 L 16 36 C 16 36.5 16.5 37 17 37 L 28 37 C 28.5 37 29 36.5 29 36 L 29 35 C 29 34 28 33.5 27 33 L 18 33 Z" />
          </svg>
        );
      case 'r':
        return (
          <svg viewBox="0 0 45 45" className="w-full h-full">
            <path d="M 11 36 C 11 36 15 35 15 34 L 15 14 C 15 14 15 13 16 13 L 17 13 L 17 11 L 18 11 L 18 13 L 20 13 L 20 11 L 21 11 L 21 13 L 24 13 L 24 11 L 25 11 L 25 13 L 27 13 L 27 11 L 28 11 L 28 13 L 29 13 C 30 13 30 14 30 14 L 30 34 C 30 35 34 36 34 36 L 34 37 L 11 37 L 11 36 Z M 17 34 L 28 34 L 28 16 L 17 16 L 17 34 Z" />
          </svg>
        );
      case 'n':
        return (
          <svg viewBox="0 0 45 45" className="w-full h-full">
            <g>
              {/* Horse head shape */}
              <path d="M 22 10 C 32.5 11 38.5 18 38 39 L 15 39 C 15 30 25 32.5 23 18" />
              {/* Horse ear and mane */}
              <path d="M 24 18 C 24.38 20.91 18.45 25.37 16 27 C 13 29 13.18 31.34 11 31 C 9.958 30.06 12.41 27.96 11 28 C 10 28 11.19 29.23 10 30 C 9 30 5.997 31 6 26 C 6 24 12 14 12 14 C 12 14 13.89 12.1 14 10.5 C 13.27 9.506 13.5 8.5 13.5 7.5 C 14.5 6.5 16.5 10 16.5 10 L 18.5 10 C 18.5 10 19.28 8.008 21 7 C 22 7 22 10 22 10" />
              {/* Horse eye */}
              <circle cx="16" cy="18" r="1.5" />
            </g>
          </svg>
        );
      case 'b':
        return (
          <svg viewBox="0 0 45 45" className="w-full h-full">
            <path d="M 22.5 8 C 20.5 8 19 9.5 19 11.5 C 19 12.5 19.5 13.5 20 14 L 19 15 C 17.5 15.5 16 17 16 19 L 16 31 C 16 32.5 17 33.5 18 34 L 27 34 C 28 33.5 29 32.5 29 31 L 29 19 C 29 17 27.5 15.5 26 15 L 25 14 C 25.5 13.5 26 12.5 26 11.5 C 26 9.5 24.5 8 22.5 8 Z M 18 34 C 17 34.5 16 35 16 36 L 16 36.5 C 16 37 16.5 37.5 17 37.5 L 28 37.5 C 28.5 37.5 29 37 29 36.5 L 29 36 C 29 35 28 34.5 27 34 L 18 34 Z" />
          </svg>
        );
      case 'q':
        return (
          <svg viewBox="0 0 45 45" className="w-full h-full">
            <path d="M 9 26 C 9 26 11 25 11.5 23 L 11.5 15 C 11 14 9.5 12 9.5 10.5 C 9.5 9 10.5 8 12 8 C 13.5 8 14.5 9 14.5 10.5 C 14.5 11.5 14 12.5 13.5 13.5 L 15 15 L 17 13.5 C 16.5 12.5 16 11.5 16 10.5 C 16 9 17 8 18.5 8 C 20 8 21 9 21 10.5 C 21 11.5 20.5 12.5 20 13.5 L 22.5 15.5 L 25 13.5 C 24.5 12.5 24 11.5 24 10.5 C 24 9 25 8 26.5 8 C 28 8 29 9 29 10.5 C 29 11.5 28.5 12.5 28 13.5 L 30 15 L 31.5 13.5 C 31 12.5 30.5 11.5 30.5 10.5 C 30.5 9 31.5 8 33 8 C 34.5 8 35.5 9 35.5 10.5 C 35.5 12 34 14 33.5 15 L 33.5 23 C 34 25 36 26 36 26 L 36 27 C 36 28 35 29 34 29.5 L 33 31 C 32.5 32 31.5 33 30 33 L 15 33 C 13.5 33 12.5 32 12 31 L 11 29.5 C 10 29 9 28 9 27 L 9 26 Z M 13 33 C 12 33.5 11 34.5 11 36 L 11 36.5 C 11 37 11.5 37.5 12 37.5 L 33 37.5 C 33.5 37.5 34 37 34 36.5 L 34 36 C 34 34.5 33 33.5 32 33 L 13 33 Z" />
          </svg>
        );
      case 'k':
        return (
          <svg viewBox="0 0 45 45" className="w-full h-full">
            <path d="M 20.5 6 L 20.5 8 L 18.5 8 L 18.5 10 L 20.5 10 L 20.5 12 L 24.5 12 L 24.5 10 L 26.5 10 L 26.5 8 L 24.5 8 L 24.5 6 L 20.5 6 Z M 22.5 13 C 20 13 18 15 18 17.5 C 18 19 18.5 20.5 19.5 21.5 L 18 23 C 17 24 16 26 16 28 L 16 30 C 16 31.5 17 32.5 18 33 L 27 33 C 28 32.5 29 31.5 29 30 L 29 28 C 29 26 28 24 27 23 L 25.5 21.5 C 26.5 20.5 27 19 27 17.5 C 27 15 25 13 22.5 13 Z M 16 33 C 15 33.5 14 34.5 14 36 L 14 36.5 C 14 37 14.5 37.5 15 37.5 L 30 37.5 C 30.5 37.5 31 37 31 36.5 L 31 36 C 31 34.5 30 33.5 29 33 L 16 33 Z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`chess-piece ${sideClass}`}>
      {getPieceSvg(type)}
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
  const lastAnimatedMoveRef = useRef<string | null>(null);

  const isWhite = metadata.whitePlayer === userId;
  const isBlack = metadata.blackPlayer === userId;
  const isMyTurn =
    (metadata.currentTurn === 'white' && isWhite) ||
    (metadata.currentTurn === 'black' && isBlack);

  const winner = metadata.winnerUserId;
  const gameOver = metadata.gameStatus === 'checkmate' || metadata.gameStatus === 'stalemate' || metadata.gameStatus === 'draw';

  // Update chess instance when FEN changes and trigger animation
  useEffect(() => {
    chess.load(metadata.fen);
    
    // Only animate if this is a NEW move we haven't animated yet
    if (metadata.lastMove) {
      const moveKey = `${metadata.lastMove.from}-${metadata.lastMove.to}`;
      
      if (lastAnimatedMoveRef.current !== moveKey) {
        lastAnimatedMoveRef.current = moveKey;
        
        const piece = chess.get(metadata.lastMove.to as Square);
        if (piece) {
          setAnimatingMove({
            from: metadata.lastMove.from,
            to: metadata.lastMove.to,
            piece: { type: piece.type, color: piece.color }
          });
          
          // Clear animation after it completes
          setTimeout(() => {
            setAnimatingMove(null);
          }, 300);
        }
      }
    }
  }, [metadata.fen, metadata.lastMove, chess]);

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

  // Calculate captured pieces
  const calculateCapturedPieces = () => {
    const startingPieces: Record<string, number> = {
      'w_p': 8, 'w_r': 2, 'w_n': 2, 'w_b': 2, 'w_q': 1, 'w_k': 1,
      'b_p': 8, 'b_r': 2, 'b_n': 2, 'b_b': 2, 'b_q': 1, 'b_k': 1,
    };
    
    const currentPieces: Record<string, number> = {
      'w_p': 0, 'w_r': 0, 'w_n': 0, 'w_b': 0, 'w_q': 0, 'w_k': 0,
      'b_p': 0, 'b_r': 0, 'b_n': 0, 'b_b': 0, 'b_q': 0, 'b_k': 0,
    };
    
    // Count current pieces on the board
    for (let rank of RANKS) {
      for (let file of FILES) {
        const sq = `${file}${rank}` as Square;
        const piece = chess.get(sq);
        if (piece) {
          const key = `${piece.color}_${piece.type}`;
          currentPieces[key]++;
        }
      }
    }
    
    // Calculate captured (missing pieces)
    const whiteCaptured: string[] = [];
    const blackCaptured: string[] = [];
    
    for (const [key, startCount] of Object.entries(startingPieces)) {
      const [color, type] = key.split('_');
      const missing = startCount - currentPieces[key];
      for (let i = 0; i < missing; i++) {
        if (color === 'w') {
          whiteCaptured.push(type);
        } else {
          blackCaptured.push(type);
        }
      }
    }
    
    return { whiteCaptured, blackCaptured };
  };

  const { whiteCaptured, blackCaptured } = calculateCapturedPieces();

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
    <Card className="w-full border-2 border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
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
                      className="absolute inset-[8%] pointer-events-none" 
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

        {/* Captured Pieces */}
        {(whiteCaptured.length > 0 || blackCaptured.length > 0) && (
          <div className="flex justify-between items-center px-2 py-2 rounded-lg bg-muted/30 min-h-[44px]">
            {/* Black's captured pieces (what White has taken) */}
            <div className="flex gap-0.5 items-center">
              <span className="text-xs text-muted-foreground mr-1">Captured:</span>
              {blackCaptured.length > 0 ? (
                blackCaptured.map((type, i) => (
                  <div key={i} className="w-6 h-6 opacity-80">
                    <ChessPiece type={type} color="b" />
                  </div>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">None</span>
              )}
            </div>
            {/* White's captured pieces (what Black has taken) */}
            <div className="flex gap-0.5 items-center">
              {whiteCaptured.length > 0 ? (
                whiteCaptured.map((type, i) => (
                  <div key={i} className="w-6 h-6 opacity-80">
                    <ChessPiece type={type} color="w" />
                  </div>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">None</span>
              )}
              <span className="text-xs text-muted-foreground ml-1">:Captured</span>
            </div>
          </div>
        )}

        {/* Move History */}
        {formattedMoves.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <span>Move History</span>
              <Badge variant="secondary" className="text-xs">{metadata.moveHistory.length}</Badge>
            </h3>
            <ScrollArea className="h-[120px] rounded-lg border border-border/50 bg-muted/20 p-3">
              <div className="space-y-1">
                {/* Column Headers */}
                <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground pb-1 border-b border-border/30">
                  <span className="w-6">#</span>
                  <span className="flex-1">White</span>
                  <span className="flex-1">Black</span>
                </div>
                {/* Move Rows */}
                {formattedMoves.map((move) => (
                  <div key={move.moveNum} className="flex items-center gap-3 text-sm font-mono">
                    <span className="text-muted-foreground font-semibold w-6">{move.moveNum}.</span>
                    <span className="flex-1 text-foreground">{move.white}</span>
                    <span className="flex-1 text-foreground">{move.black || '-'}</span>
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