import { describe, it, expect } from 'vitest';
import {
  getBestTicTacToeMove,
  checkTicTacToeWinner,
  getConnectFourAIMove,
} from '@/lib/gameAI';

describe('Tic Tac Toe AI', () => {
  describe('checkTicTacToeWinner', () => {
    it('detects horizontal win', () => {
      const board = ['X', 'X', 'X', '', '', '', '', '', ''];
      expect(checkTicTacToeWinner(board)).toBe('X');
    });

    it('detects vertical win', () => {
      const board = ['O', '', '', 'O', '', '', 'O', '', ''];
      expect(checkTicTacToeWinner(board)).toBe('O');
    });

    it('detects diagonal win', () => {
      const board = ['X', '', '', '', 'X', '', '', '', 'X'];
      expect(checkTicTacToeWinner(board)).toBe('X');
    });

    it('detects anti-diagonal win', () => {
      const board = ['', '', 'O', '', 'O', '', 'O', '', ''];
      expect(checkTicTacToeWinner(board)).toBe('O');
    });

    it('returns null for no winner', () => {
      const board = ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'O'];
      expect(checkTicTacToeWinner(board)).toBe(null);
    });

    it('returns null for empty board', () => {
      const board = ['', '', '', '', '', '', '', '', ''];
      expect(checkTicTacToeWinner(board)).toBe(null);
    });
  });

  describe('getBestTicTacToeMove (Hard difficulty)', () => {
    it('blocks opponent from winning horizontally', () => {
      const board = ['X', 'X', '', '', '', '', '', '', ''];
      const move = getBestTicTacToeMove(board, 'hard');
      expect(move).toBe(2); // Block at position 2
    });

    it('blocks opponent from winning vertically', () => {
      const board = ['O', '', '', 'O', '', '', '', '', ''];
      const move = getBestTicTacToeMove(board, 'hard');
      expect(move).toBe(6); // Block at position 6
    });

    it('takes winning move when available', () => {
      const board = ['O', 'O', '', 'X', 'X', '', '', '', ''];
      const move = getBestTicTacToeMove(board, 'hard');
      expect(move).toBe(2); // Win at position 2
    });

    it('prioritizes winning over blocking', () => {
      // O can win at position 2, X can win at position 5
      const board = ['O', 'O', '', 'X', 'X', '', '', '', ''];
      const move = getBestTicTacToeMove(board, 'hard');
      expect(move).toBe(2); // Take the win
    });

    it('takes center on empty board', () => {
      const board = ['', '', '', '', '', '', '', '', ''];
      const move = getBestTicTacToeMove(board, 'hard');
      expect(move).toBe(4); // Center is optimal first move
    });

    it('returns valid move for any board state', () => {
      const board = ['X', 'O', 'X', '', 'O', '', '', '', ''];
      const move = getBestTicTacToeMove(board, 'hard');
      expect(move).toBeGreaterThanOrEqual(0);
      expect(move).toBeLessThan(9);
      expect(board[move]).toBe(''); // Should be an empty position
    });
  });

  describe('getBestTicTacToeMove (Easy difficulty)', () => {
    it('returns a valid empty position', () => {
      const board = ['X', 'O', '', '', 'X', '', '', '', 'O'];
      const move = getBestTicTacToeMove(board, 'easy');
      expect(move).toBeGreaterThanOrEqual(0);
      expect(move).toBeLessThan(9);
      expect(board[move]).toBe('');
    });

    it('avoids filled positions', () => {
      const board = ['X', 'O', 'X', 'O', 'X', 'O', '', '', ''];
      const move = getBestTicTacToeMove(board, 'easy');
      expect([6, 7, 8]).toContain(move);
    });
  });

  describe('getBestTicTacToeMove (Medium difficulty)', () => {
    it('sometimes makes optimal moves', () => {
      // Run multiple times to test randomness
      const results = [];
      for (let i = 0; i < 10; i++) {
        const board = ['X', 'X', '', '', '', '', '', '', ''];
        const move = getBestTicTacToeMove(board, 'medium');
        results.push(move);
      }

      // Should include position 2 (blocking move) at least once
      expect(results).toContain(2);
      // But not always (should have some variation)
      expect(new Set(results).size).toBeGreaterThan(1);
    });
  });
});

describe('Connect Four AI', () => {
  it('returns a valid column (0-6)', () => {
    const board = Array(6).fill(Array(7).fill(''));
    const move = getConnectFourAIMove(board);
    expect(move).toBeGreaterThanOrEqual(0);
    expect(move).toBeLessThan(7);
  });

  it('avoids full columns', () => {
    // Create a board with column 3 full
    const board = Array(6)
      .fill(null)
      .map((_, row) => {
        const rowArray = Array(7).fill('');
        rowArray[3] = 'X'; // Fill column 3
        return rowArray;
      });

    const move = getConnectFourAIMove(board);
    expect(move).not.toBe(3);
  });

  it('prefers center columns', () => {
    const board = Array(6)
      .fill(null)
      .map(() => Array(7).fill(''));

    // Test multiple times to see if center is preferred
    const moves = [];
    for (let i = 0; i < 20; i++) {
      moves.push(getConnectFourAIMove(board));
    }

    // Center columns (2, 3, 4) should appear more frequently
    const centerMoves = moves.filter((m) => m >= 2 && m <= 4);
    expect(centerMoves.length).toBeGreaterThan(moves.length * 0.4); // At least 40% center
  });
});
