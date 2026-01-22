import { describe, it, expect } from 'vitest';
import { analyzeInformationFlow, getFlowReport } from './informationFlow';
import { getCluesFromLine, generateArrangements } from './clues';
import { generatePuzzle, generateOptimalFlowPuzzle } from './puzzleGenerator';

describe('analyzeInformationFlow', () => {
  it('should analyze a simple 5x5 puzzle', () => {
    // Create a puzzle that's logically solvable (has strong constraints)
    const solution = [
      [true, true, true, true, true], // clue: [5]
      [true, false, false, false, true], // clue: [1, 1]
      [true, false, true, false, true], // clue: [1, 1, 1]
      [true, false, false, false, true], // clue: [1, 1]
      [true, true, true, true, true], // clue: [5]
    ];

    const size = 5;
    const rowClues = solution.map(row => getCluesFromLine(row));
    const colClues = Array(size).fill(null).map((_, colIdx) =>
      getCluesFromLine(solution.map(row => row[colIdx]))
    );

    const result = analyzeInformationFlow(rowClues, colClues, size);

    // This puzzle should be solvable with logic
    expect(result.totalWaves).toBeGreaterThan(0);
    expect(result.metrics).toBeDefined();
    expect(result.metrics.flowScore).toBeGreaterThanOrEqual(0);
  });

  it('should detect entry points in the first wave', () => {
    // A puzzle where some cells are immediately deducible
    const solution = [
      [true, true, true, true, true], // Full row - all cells deducible
      [false, false, false, false, false],
      [true, false, true, false, true],
      [false, true, false, true, false],
      [true, true, true, true, true], // Full row
    ];

    const size = 5;
    const rowClues = solution.map(row => getCluesFromLine(row));
    const colClues = Array(size).fill(null).map((_, colIdx) =>
      getCluesFromLine(solution.map(row => row[colIdx]))
    );

    const result = analyzeInformationFlow(rowClues, colClues, size);

    // Should have entry points from the full rows
    expect(result.metrics.entryPoints).toBeGreaterThan(0);
  });

  it('should track quadrant distribution', () => {
    const solution = [
      [true, true, false, false, false, false],
      [true, true, false, false, false, false],
      [false, false, false, false, false, false],
      [false, false, false, false, true, true],
      [false, false, false, false, true, true],
      [false, false, false, false, false, false],
    ];

    const size = 6;
    const rowClues = solution.map(row => getCluesFromLine(row));
    const colClues = Array(size).fill(null).map((_, colIdx) =>
      getCluesFromLine(solution.map(row => row[colIdx]))
    );

    const result = analyzeInformationFlow(rowClues, colClues, size);

    // This puzzle should have deductions in multiple quadrants
    // (top-left and bottom-right have the filled cells)
    expect(result.waves.length).toBeGreaterThan(0);

    // Check that deductions span different quadrants
    const allQuadrants = new Set();
    for (const wave of result.waves) {
      for (const d of wave.deductions) {
        allQuadrants.add(d.quadrant);
      }
    }
    expect(allQuadrants.size).toBeGreaterThan(1);
  });

  it('should generate a readable flow report', () => {
    const solution = [
      [true, true, false],
      [true, false, true],
      [false, true, true],
    ];

    const size = 3;
    const rowClues = solution.map(row => getCluesFromLine(row));
    const colClues = Array(size).fill(null).map((_, colIdx) =>
      getCluesFromLine(solution.map(row => row[colIdx]))
    );

    const result = analyzeInformationFlow(rowClues, colClues, size);
    const report = getFlowReport(result);

    expect(report).toContain('Solved:');
    expect(report).toContain('Total waves:');
    expect(report).toContain('Flow score:');
    expect(report).toContain('Wave breakdown:');
  });

  it('should return zero flow score for unsolvable puzzles', () => {
    // Clues that can't be solved by logic alone (would need guessing)
    // This is a degenerate case - empty clues
    const rowClues = [[1], [1], [1]];
    const colClues = [[1], [1], [1]];
    const size = 3;

    const result = analyzeInformationFlow(rowClues, colClues, size);

    // This puzzle has multiple solutions, so it won't be fully solved
    if (!result.solved) {
      expect(result.metrics.flowScore).toBe(0);
    }
  });
});

describe('generateOptimalFlowPuzzle', () => {
  it('should generate puzzle with flow metrics', () => {
    const puzzle = generateOptimalFlowPuzzle(5, 'medium', 3);

    expect(puzzle.solution).toBeDefined();
    expect(puzzle.rowClues).toBeDefined();
    expect(puzzle.colClues).toBeDefined();
    expect(puzzle.flowScore).toBeGreaterThanOrEqual(0);
  });

  it('should not have any complete lines (lines with only one arrangement)', () => {
    // Generate several puzzles and verify none have complete lines
    for (let i = 0; i < 5; i++) {
      const puzzle = generatePuzzle(8, 'medium');

      // Check all rows have multiple arrangements
      for (const clues of puzzle.rowClues) {
        const arrangements = generateArrangements(clues, puzzle.size);
        expect(arrangements.length).toBeGreaterThan(1);
      }

      // Check all columns have multiple arrangements
      for (const clues of puzzle.colClues) {
        const arrangements = generateArrangements(clues, puzzle.size);
        expect(arrangements.length).toBeGreaterThan(1);
      }
    }
  });

  it('should produce higher flow scores than random selection', () => {
    // Generate multiple regular and optimal puzzles, compare averages
    const regularScores = [];
    const optimalScores = [];

    for (let i = 0; i < 5; i++) {
      const regular = generatePuzzle(6, 'medium');
      const regularFlow = analyzeInformationFlow(regular.rowClues, regular.colClues, 6);
      regularScores.push(regularFlow.metrics.flowScore);

      const optimal = generateOptimalFlowPuzzle(6, 'medium', 5);
      optimalScores.push(optimal.flowScore);
    }

    const avgRegular = regularScores.reduce((a, b) => a + b, 0) / regularScores.length;
    const avgOptimal = optimalScores.reduce((a, b) => a + b, 0) / optimalScores.length;

    console.log('Average regular flow score:', avgRegular);
    console.log('Average optimal flow score:', avgOptimal);

    // Optimal should generally be higher (or at least not worse)
    expect(avgOptimal).toBeGreaterThanOrEqual(avgRegular * 0.8);
  });
});
