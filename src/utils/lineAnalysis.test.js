import { describe, it, expect } from 'vitest';
import { analyzeLine, isClueCompleted, areAllCluesComplete } from './lineAnalysis';

describe('analyzeLine', () => {
  describe('cellsToMark', () => {
    it('returns empty array for empty line with no constraints', () => {
      const line = [null, null, null, null, null];
      const clues = [2];
      const { cellsToMark } = analyzeLine(line, clues);
      // With clue [2] on length 5, positions 0-3 could all be valid starts
      // No cell can be definitively marked as X
      expect(cellsToMark).toEqual([]);
    });

    it('marks cells that must be empty based on filled cells', () => {
      // Line: [filled, null, null, null, null] with clue [1]
      // The filled cell satisfies clue [1], so remaining must be X
      const line = [1, null, null, null, null];
      const clues = [1];
      const { cellsToMark } = analyzeLine(line, clues);
      expect(cellsToMark).toEqual([1, 2, 3, 4]);
    });

    it('marks edges when group is near edge with small clue', () => {
      // Line: [null, filled, null, null, null] with clue [1]
      // If cell 1 is filled and clue is 1, cells 0 and 2-4 must be X
      const line = [null, 1, null, null, null];
      const clues = [1];
      const { cellsToMark } = analyzeLine(line, clues);
      expect(cellsToMark).toEqual([0, 2, 3, 4]);
    });

    it('handles X marks as constraints', () => {
      // Line: [X, null, null, null, null] with clue [2]
      // First cell is X, so group must start at index 1 or later
      const line = [0, null, null, null, null];
      const clues = [2];
      const { cellsToMark } = analyzeLine(line, clues);
      // Group of 2 can be at positions 1-2, 2-3, or 3-4
      expect(cellsToMark).toEqual([]);
    });

    it('marks cells between completed groups', () => {
      // Line: [filled, X, null, null, filled] with clues [1, 1]
      // First and last groups are complete, middle must be X
      const line = [1, 0, null, null, 1];
      const clues = [1, 1];
      const { cellsToMark } = analyzeLine(line, clues);
      expect(cellsToMark).toEqual([2, 3]);
    });

    it('handles line where all cells are determined', () => {
      const line = [1, 1, 0, 1];
      const clues = [2, 1];
      const { cellsToMark } = analyzeLine(line, clues);
      expect(cellsToMark).toEqual([]);
    });

    it('handles zero clue (empty line)', () => {
      const line = [null, null, null];
      const clues = [0];
      const { cellsToMark } = analyzeLine(line, clues);
      expect(cellsToMark).toEqual([0, 1, 2]);
    });
  });

  describe('completedClues', () => {
    it('returns all false for empty line', () => {
      const line = [null, null, null, null, null];
      const clues = [2, 1];
      const { completedClues } = analyzeLine(line, clues);
      expect(completedClues).toEqual([false, false]);
    });

    it('marks clue complete when group is anchored and closed from left', () => {
      // Line: [filled, X, null, null, null] with clues [1, 2]
      // First clue is complete (anchored at start, closed by X)
      // Second clue needs 2 cells and is not yet placed
      const line = [1, 0, null, null, null];
      const clues = [1, 2];
      const { completedClues } = analyzeLine(line, clues);
      expect(completedClues[0]).toBe(true);
      expect(completedClues[1]).toBe(false);
    });

    it('marks clue complete when group is anchored and closed from right', () => {
      // Line: [null, null, null, X, filled] with clues [2, 1]
      // Last clue is complete (anchored at end, closed by X)
      // First clue needs 2 cells and is not yet placed
      const line = [null, null, null, 0, 1];
      const clues = [2, 1];
      const { completedClues } = analyzeLine(line, clues);
      expect(completedClues[0]).toBe(false);
      expect(completedClues[1]).toBe(true);
    });

    it('marks all clues complete when line is solved', () => {
      const line = [1, 1, 0, 1];
      const clues = [2, 1];
      const { completedClues } = analyzeLine(line, clues);
      expect(completedClues).toEqual([true, true]);
    });

    it('does not mark clue complete if group is not closed', () => {
      // Line: [filled, null, null, null, null] with clue [2]
      // Group started but could extend, not complete
      const line = [1, null, null, null, null];
      const clues = [2];
      const { completedClues } = analyzeLine(line, clues);
      expect(completedClues[0]).toBe(false);
    });

    it('marks clue complete when group size matches and is bounded', () => {
      // Line: [filled, filled, X, null, null] with clues [2, 1]
      // First clue [2] is complete
      const line = [1, 1, 0, null, null];
      const clues = [2, 1];
      const { completedClues } = analyzeLine(line, clues);
      expect(completedClues[0]).toBe(true);
      expect(completedClues[1]).toBe(false);
    });

    it('handles single cell clue at edge', () => {
      const line = [1, 0, null, null, null];
      const clues = [1];
      const { completedClues } = analyzeLine(line, clues);
      expect(completedClues[0]).toBe(true);
    });

    it('handles clue completion from both ends meeting in middle', () => {
      const line = [1, 0, null, 0, 1];
      const clues = [1, 1];
      const { completedClues } = analyzeLine(line, clues);
      expect(completedClues).toEqual([true, true]);
    });
  });

  describe('edge cases', () => {
    it('handles single cell line', () => {
      const line = [1];
      const clues = [1];
      const { completedClues, cellsToMark } = analyzeLine(line, clues);
      expect(completedClues).toEqual([true]);
      expect(cellsToMark).toEqual([]);
    });

    it('handles invalid state gracefully', () => {
      // More filled cells than clues allow
      const line = [1, 1, 1, 1, 1];
      const clues = [2];
      const { completedClues, cellsToMark } = analyzeLine(line, clues);
      // Should return without crashing, with empty results
      expect(completedClues).toEqual([false]);
      expect(cellsToMark).toEqual([]);
    });

    it('handles multiple groups with same size', () => {
      const line = [1, 1, 0, 1, 1];
      const clues = [2, 2];
      const { completedClues } = analyzeLine(line, clues);
      expect(completedClues).toEqual([true, true]);
    });

    it('handles large gap between groups', () => {
      const line = [1, 0, 0, 0, 1];
      const clues = [1, 1];
      const { completedClues } = analyzeLine(line, clues);
      expect(completedClues).toEqual([true, true]);
    });
  });

  describe('duplicate clue values', () => {
    it('does not mark any clue complete when group could belong to multiple clues', () => {
      // Line: [filled, X, null, null, null, null, null] with clues [1, 1, 1]
      // First group is complete but could be clue 0, 1, or 2
      // Without more context, we cannot definitively assign it
      const line = [1, 0, null, null, null, null, null];
      const clues = [1, 1, 1];
      const { completedClues } = analyzeLine(line, clues);
      // First clue should be marked complete since it's anchored at start
      expect(completedClues[0]).toBe(true);
      expect(completedClues[1]).toBe(false);
      expect(completedClues[2]).toBe(false);
    });

    it('marks only definitively completed clues with duplicate values', () => {
      // Line: [filled, X, null, null, X, filled] with clues [1, 1]
      // Both groups are complete and unambiguously assigned
      const line = [1, 0, null, null, 0, 1];
      const clues = [1, 1];
      const { completedClues } = analyzeLine(line, clues);
      expect(completedClues).toEqual([true, true]);
    });

    it('handles middle group ambiguity with three identical clues', () => {
      // Line: [filled, X, filled, X, null, null, null] with clues [1, 1, 1]
      // First two groups done, third not yet placed
      const line = [1, 0, 1, 0, null, null, null];
      const clues = [1, 1, 1];
      const { completedClues } = analyzeLine(line, clues);
      expect(completedClues[0]).toBe(true);
      expect(completedClues[1]).toBe(true);
      expect(completedClues[2]).toBe(false);
    });

    it('handles all three identical clues completed', () => {
      // Line: [filled, X, filled, X, filled] with clues [1, 1, 1]
      const line = [1, 0, 1, 0, 1];
      const clues = [1, 1, 1];
      const { completedClues } = analyzeLine(line, clues);
      expect(completedClues).toEqual([true, true, true]);
    });

    it('does not mark middle clue complete when not bounded by X', () => {
      // Line: [filled, X, null, filled, null, X, filled] with clues [1, 1, 1]
      // First and last are anchored at edges with X, but middle has null neighbors
      const line = [1, 0, null, 1, null, 0, 1];
      const clues = [1, 1, 1];
      const { completedClues } = analyzeLine(line, clues);
      expect(completedClues[0]).toBe(true);
      // Middle clue is not bounded by X on both sides (has null neighbors)
      expect(completedClues[1]).toBe(false);
      expect(completedClues[2]).toBe(true);
    });

    it('handles partial completion with duplicate clues', () => {
      // Line with enough space for ambiguity
      // [null, filled, null, null, null, null, null] with clues [1, 1]
      const line = [null, 1, null, null, null, null, null];
      const clues = [1, 1];
      const { completedClues } = analyzeLine(line, clues);
      // The filled cell could be either the first or second clue
      expect(completedClues[0]).toBe(false);
      expect(completedClues[1]).toBe(false);
    });
  });
});

describe('isClueCompleted', () => {
  it('returns true for completed clue', () => {
    const line = [1, 0, null, null, null];
    const clues = [1, 2];
    expect(isClueCompleted(line, 0, clues)).toBe(true);
  });

  it('returns false for incomplete clue', () => {
    const line = [1, 0, null, null, null];
    const clues = [1, 2];
    expect(isClueCompleted(line, 1, clues)).toBe(false);
  });
});

describe('areAllCluesComplete', () => {
  it('returns true when all clues are complete', () => {
    const line = [1, 1, 0, 1];
    const clues = [2, 1];
    expect(areAllCluesComplete(line, clues)).toBe(true);
  });

  it('returns false when some clues are incomplete', () => {
    // Line: [filled, filled, X, null, null] - second clue not yet placed
    const line = [1, 1, 0, null, null];
    const clues = [2, 1];
    expect(areAllCluesComplete(line, clues)).toBe(false);
  });

  it('returns false for empty line', () => {
    const line = [null, null, null, null];
    const clues = [2, 1];
    expect(areAllCluesComplete(line, clues)).toBe(false);
  });
});
