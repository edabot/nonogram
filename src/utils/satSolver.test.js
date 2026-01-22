import { describe, it, expect } from 'vitest';
import { countSolutionsSAT, solvePuzzleSAT } from './satSolver';

describe('SAT Solver', () => {
  describe('countSolutionsSAT', () => {
    it('returns 1 for a simple unique puzzle', () => {
      // 3x3 puzzle with unique solution:
      // ■ ■ ■
      // ■ _ _
      // ■ _ _
      const rowClues = [[3], [1], [1]];
      const colClues = [[3], [1], [1]];
      expect(countSolutionsSAT(rowClues, colClues, 3)).toBe(1);
    });

    it('returns 2 for a puzzle with multiple solutions', () => {
      // 2x2 puzzle with clues that allow multiple solutions
      // Clues: rows [1], [1], cols [1], [1]
      // Could be: ■_ or _■
      //           _■    ■_
      const rowClues = [[1], [1]];
      const colClues = [[1], [1]];
      expect(countSolutionsSAT(rowClues, colClues, 2)).toBe(2);
    });

    it('returns 1 for a fully constrained puzzle', () => {
      // 2x2 all filled
      const rowClues = [[2], [2]];
      const colClues = [[2], [2]];
      expect(countSolutionsSAT(rowClues, colClues, 2)).toBe(1);
    });

    it('returns 1 for a puzzle with zero clues (empty)', () => {
      // 2x2 all empty
      const rowClues = [[0], [0]];
      const colClues = [[0], [0]];
      expect(countSolutionsSAT(rowClues, colClues, 2)).toBe(1);
    });

    it('handles a 5x5 puzzle', () => {
      // Simple diagonal pattern - should be unique
      const rowClues = [[1], [1], [1], [1], [1]];
      const colClues = [[1], [1], [1], [1], [1]];
      // This actually has many solutions (any permutation)
      expect(countSolutionsSAT(rowClues, colClues, 5)).toBe(2);
    });
  });

  describe('solvePuzzleSAT', () => {
    it('solves a simple puzzle', () => {
      const rowClues = [[2], [1], [2]];
      const colClues = [[1], [3], [1]];
      const solution = solvePuzzleSAT(rowClues, colClues, 3);

      expect(solution).not.toBeNull();
      expect(solution).toHaveLength(3);
      expect(solution[0]).toHaveLength(3);

      // Verify solution matches clues
      // Row 0 should have 2 consecutive filled cells
      expect(solution[0].filter(c => c).length).toBe(2);
      // Row 1 should have 1 filled cell
      expect(solution[1].filter(c => c).length).toBe(1);
      // Row 2 should have 2 consecutive filled cells
      expect(solution[2].filter(c => c).length).toBe(2);
    });

    it('returns null for impossible puzzle', () => {
      // Impossible: row wants 2 consecutive but columns don't allow it
      // 2x2 grid: row 0 wants [2], row 1 wants [0]
      // but col 0 wants [0], col 1 wants [0]
      const rowClues = [[2], [0]];
      const colClues = [[0], [0]];
      const solution = solvePuzzleSAT(rowClues, colClues, 2);
      expect(solution).toBeNull();
    });
  });
});
