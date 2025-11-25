/**
 * Game AI Logic
 * Contains algorithms for computer opponents in various games
 */

// ===== TIC TAC TOE AI =====

type TicTacToeBoard = ('X' | 'O' | null)[][];

interface TicTacToeMove {
  row: number;
  col: number;
  score: number;
}

/**
 * Check if there's a winner on the board
 */
function checkTicTacToeWinner(board: TicTacToeBoard, player: 'X' | 'O'): boolean {
  // Check rows
  for (let i = 0; i < 3; i++) {
    if (board[i][0] === player && board[i][1] === player && board[i][2] === player) {
      return true;
    }
  }

  // Check columns
  for (let i = 0; i < 3; i++) {
    if (board[0][i] === player && board[1][i] === player && board[2][i] === player) {
      return true;
    }
  }

  // Check diagonals
  if (board[0][0] === player && board[1][1] === player && board[2][2] === player) {
    return true;
  }
  if (board[0][2] === player && board[1][1] === player && board[2][0] === player) {
    return true;
  }

  return false;
}

/**
 * Check if the board is full (draw)
 */
function isBoardFull(board: TicTacToeBoard): boolean {
  return board.every(row => row.every(cell => cell !== null));
}

/**
 * Get all empty positions on the board
 */
function getEmptyPositions(board: TicTacToeBoard): { row: number; col: number }[] {
  const positions: { row: number; col: number }[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (board[row][col] === null) {
        positions.push({ row, col });
      }
    }
  }
  return positions;
}

/**
 * Minimax algorithm for Tic Tac Toe
 */
function minimax(
  board: TicTacToeBoard,
  depth: number,
  isMaximizing: boolean,
  aiSymbol: 'X' | 'O',
  humanSymbol: 'X' | 'O'
): number {
  // Check terminal states
  if (checkTicTacToeWinner(board, aiSymbol)) return 10 - depth;
  if (checkTicTacToeWinner(board, humanSymbol)) return depth - 10;
  if (isBoardFull(board)) return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (board[row][col] === null) {
          board[row][col] = aiSymbol;
          const score = minimax(board, depth + 1, false, aiSymbol, humanSymbol);
          board[row][col] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (board[row][col] === null) {
          board[row][col] = humanSymbol;
          const score = minimax(board, depth + 1, true, aiSymbol, humanSymbol);
          board[row][col] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
    }
    return bestScore;
  }
}

/**
 * Get the best move for Tic Tac Toe AI
 */
export function getTicTacToeAIMove(
  board: TicTacToeBoard,
  difficulty: 'easy' | 'medium' | 'hard',
  aiSymbol: 'X' | 'O' = 'O',
  humanSymbol: 'X' | 'O' = 'X'
): { row: number; col: number } | null {
  const emptyPositions = getEmptyPositions(board);

  if (emptyPositions.length === 0) return null;

  // For medium and hard: ALWAYS check for immediate wins and blocks first
  if (difficulty !== 'easy') {
    // Step 1: Check if AI can win immediately
    for (const { row, col } of emptyPositions) {
      board[row][col] = aiSymbol;
      if (checkTicTacToeWinner(board, aiSymbol)) {
        board[row][col] = null;
        return { row, col };
      }
      board[row][col] = null;
    }

    // Step 2: Block opponent's winning move
    for (const { row, col } of emptyPositions) {
      board[row][col] = humanSymbol;
      if (checkTicTacToeWinner(board, humanSymbol)) {
        board[row][col] = null;
        return { row, col };
      }
      board[row][col] = null;
    }
  }

  // Easy: 75% random moves (player wins ~75% of time)
  if (difficulty === 'easy') {
    if (Math.random() < 0.75) {
      return emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
    }
  }

  // Medium: After checking critical moves, 55% random for non-critical positions (player wins ~45% of time)
  if (difficulty === 'medium') {
    if (Math.random() < 0.55) {
      return emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
    }
  }

  // Hard: Always optimal (100%)
  // Find best move using Minimax
  let bestScore = -Infinity;
  let bestMove: { row: number; col: number } | null = null;

  for (const { row, col } of emptyPositions) {
    board[row][col] = aiSymbol;
    const score = minimax(board, 0, false, aiSymbol, humanSymbol);
    board[row][col] = null;

    if (score > bestScore) {
      bestScore = score;
      bestMove = { row, col };
    }
  }

  return bestMove;
}

// ===== CONNECT FOUR AI =====

type ConnectFourBoard = ('R' | 'Y' | null)[][];

/**
 * Check if there's a win in Connect Four
 */
function checkConnectFourWin(board: ConnectFourBoard, row: number, col: number, player: 'R' | 'Y'): boolean {
  const directions = [
    [0, 1],   // Horizontal
    [1, 0],   // Vertical
    [1, 1],   // Diagonal down-right
    [1, -1],  // Diagonal down-left
  ];

  for (const [dr, dc] of directions) {
    let count = 1;

    // Count in positive direction
    for (let i = 1; i < 4; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r >= 0 && r < 6 && c >= 0 && c < 7 && board[r][c] === player) {
        count++;
      } else {
        break;
      }
    }

    // Count in negative direction
    for (let i = 1; i < 4; i++) {
      const r = row - dr * i;
      const c = col - dc * i;
      if (r >= 0 && r < 6 && c >= 0 && c < 7 && board[r][c] === player) {
        count++;
      } else {
        break;
      }
    }

    if (count >= 4) return true;
  }

  return false;
}

/**
 * Get available columns in Connect Four
 */
function getAvailableColumns(board: ConnectFourBoard): number[] {
  const columns: number[] = [];
  for (let col = 0; col < 7; col++) {
    if (board[0][col] === null) {
      columns.push(col);
    }
  }
  return columns;
}

/**
 * Get the row where a piece would land in a column
 */
function getDropRow(board: ConnectFourBoard, col: number): number {
  for (let row = 5; row >= 0; row--) {
    if (board[row][col] === null) {
      return row;
    }
  }
  return -1;
}

/**
 * Evaluate Connect Four board position
 */
function evaluateConnectFourPosition(board: ConnectFourBoard, player: 'R' | 'Y'): number {
  let score = 0;
  const opponent = player === 'R' ? 'Y' : 'R';

  // Check all possible 4-in-a-row combinations
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 7; col++) {
      for (const [dr, dc] of directions) {
        let window: (string | null)[] = [];
        for (let i = 0; i < 4; i++) {
          const r = row + dr * i;
          const c = col + dc * i;
          if (r >= 0 && r < 6 && c >= 0 && c < 7) {
            window.push(board[r][c]);
          }
        }

        if (window.length === 4) {
          const playerCount = window.filter(cell => cell === player).length;
          const opponentCount = window.filter(cell => cell === opponent).length;
          const emptyCount = window.filter(cell => cell === null).length;

          if (playerCount === 4) score += 100;
          else if (playerCount === 3 && emptyCount === 1) score += 5;
          else if (playerCount === 2 && emptyCount === 2) score += 2;

          if (opponentCount === 3 && emptyCount === 1) score -= 4;
        }
      }
    }
  }

  return score;
}

/**
 * Get the best move for Connect Four AI
 */
export function getConnectFourAIMove(
  board: ConnectFourBoard,
  difficulty: 'easy' | 'medium' | 'hard',
  aiPlayer: 'R' | 'Y' = 'Y'
): number | null {
  const availableColumns = getAvailableColumns(board);

  if (availableColumns.length === 0) return null;

  // Easy: Random move
  if (difficulty === 'easy') {
    return availableColumns[Math.floor(Math.random() * availableColumns.length)];
  }

  // Check for immediate win
  for (const col of availableColumns) {
    const row = getDropRow(board, col);
    if (row !== -1) {
      board[row][col] = aiPlayer;
      if (checkConnectFourWin(board, row, col, aiPlayer)) {
        board[row][col] = null;
        return col;
      }
      board[row][col] = null;
    }
  }

  // Check for blocking opponent's win
  const opponent = aiPlayer === 'R' ? 'Y' : 'R';
  for (const col of availableColumns) {
    const row = getDropRow(board, col);
    if (row !== -1) {
      board[row][col] = opponent;
      if (checkConnectFourWin(board, row, col, opponent)) {
        board[row][col] = null;
        return col;
      }
      board[row][col] = null;
    }
  }

  // Medium: 50% random, 50% strategic
  if (difficulty === 'medium' && Math.random() < 0.5) {
    return availableColumns[Math.floor(Math.random() * availableColumns.length)];
  }

  // Hard: Evaluate all positions
  let bestScore = -Infinity;
  let bestCol = availableColumns[0];

  for (const col of availableColumns) {
    const row = getDropRow(board, col);
    if (row !== -1) {
      board[row][col] = aiPlayer;
      const score = evaluateConnectFourPosition(board, aiPlayer);
      board[row][col] = null;

      if (score > bestScore) {
        bestScore = score;
        bestCol = col;
      }
    }
  }

  return bestCol;
}

// ===== CHECKERS AI =====

type CheckersBoard = ('R' | 'r' | 'B' | 'b' | null)[][];

/**
 * Get simple Checkers AI move (basic strategy)
 */
export function getCheckersAIMove(
  board: CheckersBoard,
  difficulty: 'easy' | 'medium' | 'hard',
  aiColor: 'red' | 'black'
): { from: { row: number; col: number }; to: { row: number; col: number } } | null {
  const aiPieces = aiColor === 'red' ? ['R', 'r'] : ['B', 'b'];

  // Find all possible moves
  const moves: { from: { row: number; col: number }; to: { row: number; col: number }; score: number }[] = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && aiPieces.includes(piece)) {
        // Check possible moves (simplified)
        const direction = aiColor === 'red' ? -1 : 1;
        const possibleMoves = [
          { row: row + direction, col: col - 1 },
          { row: row + direction, col: col + 1 },
        ];

        for (const move of possibleMoves) {
          if (
            move.row >= 0 &&
            move.row < 8 &&
            move.col >= 0 &&
            move.col < 8 &&
            board[move.row][move.col] === null
          ) {
            moves.push({
              from: { row, col },
              to: { row: move.row, col: move.col },
              score: Math.random(), // Basic random scoring
            });
          }
        }
      }
    }
  }

  if (moves.length === 0) return null;

  // Easy: Random move
  if (difficulty === 'easy') {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // Medium/Hard: Best scored move
  moves.sort((a, b) => b.score - a.score);
  return moves[0];
}
