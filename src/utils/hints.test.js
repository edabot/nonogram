import { describe, it, expect } from 'vitest';
import { findDeducibleCells, getLogicalHint } from './hints';

describe('findDeducibleCells', () => {
  it('finds cells that must be filled based on clue overlap', () => {
    // 5-cell line with clue [4] - middle 3 cells must be filled
    const playerGrid = [[null, null, null, null, null]];
    const rowClues = [[4]];
    const colClues = [[1], [1], [1], [1], [1]];

    const { cellsToFill } = findDeducibleCells(playerGrid, rowClues, colClues);

    // Cells 1, 2, 3 must be filled (overlap of positions 0-3 and 1-4)
    expect(cellsToFill).toContainEqual({ row: 0, col: 1 });
    expect(cellsToFill).toContainEqual({ row: 0, col: 2 });
    expect(cellsToFill).toContainEqual({ row: 0, col: 3 });
  });

  it('finds cells that must be empty', () => {
    // Line with filled cell and clue [1] - other cells must be X
    const playerGrid = [[1, null, null]];
    const rowClues = [[1]];
    const colClues = [[1], [0], [0]];

    const { cellsToMark } = findDeducibleCells(playerGrid, rowClues, colClues);

    expect(cellsToMark).toContainEqual({ row: 0, col: 1 });
    expect(cellsToMark).toContainEqual({ row: 0, col: 2 });
  });

  it('returns no deductions when line is ambiguous', () => {
    // 3x3 grid where clue [1] on 3 cells has no overlap
    const playerGrid = [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ];
    const rowClues = [[1], [1], [1]];
    const colClues = [[1], [1], [1]];

    const { cellsToFill, cellsToMark } = findDeducibleCells(playerGrid, rowClues, colClues);

    // No deductions possible - clue [1] on 3 cells has no overlap in any direction
    expect(cellsToFill.length).toBe(0);
    expect(cellsToMark.length).toBe(0);
  });

  it('deduces from both rows and columns', () => {
    // 2x2 grid where both row and column analysis help
    const playerGrid = [
      [null, null],
      [null, null]
    ];
    const rowClues = [[2], [0]];
    const colClues = [[1], [1]];

    const { cellsToFill, cellsToMark } = findDeducibleCells(playerGrid, rowClues, colClues);

    // Row 0 needs both filled (clue [2]), row 1 all empty (clue [0])
    expect(cellsToFill).toContainEqual({ row: 0, col: 0 });
    expect(cellsToFill).toContainEqual({ row: 0, col: 1 });
    expect(cellsToMark).toContainEqual({ row: 1, col: 0 });
    expect(cellsToMark).toContainEqual({ row: 1, col: 1 });
  });

  it('does not duplicate cells found by both row and column', () => {
    const playerGrid = [
      [null, null],
      [null, null]
    ];
    const rowClues = [[2], [2]];
    const colClues = [[2], [2]];

    const { cellsToFill } = findDeducibleCells(playerGrid, rowClues, colClues);

    // All 4 cells must be filled, but should not have duplicates
    expect(cellsToFill.length).toBe(4);
    const unique = new Set(cellsToFill.map(c => `${c.row},${c.col}`));
    expect(unique.size).toBe(4);
  });
});

describe('getLogicalHint', () => {
  it('returns a cell to fill when one can be deduced', () => {
    const playerGrid = [[null, null, null, null, null]];
    const rowClues = [[4]];
    const colClues = [[1], [1], [1], [1], [1]];

    const hint = getLogicalHint(playerGrid, rowClues, colClues);

    expect(hint).not.toBeNull();
    expect(hint.value).toBe(1);
    expect(hint.type).toBe('fill');
    expect([1, 2, 3]).toContain(hint.col);
  });

  it('returns a cell to mark when only X can be deduced', () => {
    // Grid where we can only deduce X marks
    const playerGrid = [[1, null, null]];
    const rowClues = [[1]];
    const colClues = [[1], [0], [0]];

    const hint = getLogicalHint(playerGrid, rowClues, colClues);

    expect(hint).not.toBeNull();
    expect(hint.value).toBe(0);
    expect(hint.type).toBe('mark');
  });

  it('prioritizes fill over mark', () => {
    // Grid where both fills and marks can be deduced
    const playerGrid = [
      [null, null],
      [null, null]
    ];
    const rowClues = [[2], [0]];
    const colClues = [[1], [1]];

    const hint = getLogicalHint(playerGrid, rowClues, colClues);

    // Should return a fill hint, not a mark hint
    expect(hint.value).toBe(1);
    expect(hint.type).toBe('fill');
  });

  it('returns null when nothing can be deduced', () => {
    // Ambiguous grid state
    const playerGrid = [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ];
    const rowClues = [[1], [1], [1]];
    const colClues = [[1], [1], [1]];

    const hint = getLogicalHint(playerGrid, rowClues, colClues);

    expect(hint).toBeNull();
  });
});
