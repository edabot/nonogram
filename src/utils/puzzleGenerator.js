import { getCluesFromLine } from './clues';
import { countSolutionsSAT } from './satSolver';
import { countSolutions } from './solver';
import { analyzeInformationFlow } from './informationFlow';

/**
 * Calculate the minimum space needed for a set of clues.
 * This is the sum of all clue values plus the required gaps between them.
 */
const minSpaceForClues = (clues) => {
  if (clues.length === 1 && clues[0] === 0) return 0;
  // Sum of clues + (number of gaps between clues)
  return clues.reduce((sum, c) => sum + c, 0) + (clues.length - 1);
};

/**
 * Check if a line has only one possible arrangement.
 * A line has multiple arrangements only if minSpace < lineLength.
 */
const hasMultipleArrangements = (clues, lineLength) => {
  return minSpaceForClues(clues) < lineLength;
};

/**
 * Check if any line (row or column) has only one possible arrangement.
 * Returns true if all lines have multiple arrangements (no "complete" lines).
 */
const hasNoCompleteLines = (rowClues, colClues, size) => {
  // Check all rows
  for (const clues of rowClues) {
    if (!hasMultipleArrangements(clues, size)) {
      return false;
    }
  }

  // Check all columns
  for (const clues of colClues) {
    if (!hasMultipleArrangements(clues, size)) {
      return false;
    }
  }

  return true;
};

// Threshold for using SAT solver vs constraint propagation
// SAT solver is more thorough but uses more memory on large/sparse grids
// 10x10 is safe, larger grids (especially hard/sparse) can exhaust WASM memory
const SAT_SOLVER_MAX_SIZE = 10;

// Density settings by difficulty
const DENSITY_BY_DIFFICULTY = {
  easy: 0.65,
  medium: 0.50,
  hard: 0.35,
};

// Minimum flow score thresholds by difficulty
// Higher score = more interesting information flow (solving moves around grid)
const MIN_FLOW_SCORE = {
  easy: 0.1,
  medium: 0.25,
  hard: 0.35,
};

// Generate a random puzzle with unique solution
export const generatePuzzle = (size, difficulty = 'medium') => {
  // Try multiple attempts to find a unique puzzle
  const maxAttempts = 100;
  const density = DENSITY_BY_DIFFICULTY[difficulty] || 0.5;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const solution = Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => Math.random() < density)
    );

    // Ensure every row has at least one filled cell
    solution.forEach(row => {
      if (!row.some(cell => cell)) {
        row[Math.floor(Math.random() * size)] = true;
      }
    });

    // Ensure every column has at least one filled cell
    for (let col = 0; col < size; col++) {
      if (!solution.some(row => row[col])) {
        solution[Math.floor(Math.random() * size)][col] = true;
      }
    }

    const rowClues = solution.map(row => getCluesFromLine(row));
    const colClues = Array(size).fill(null).map((_, colIdx) =>
      getCluesFromLine(solution.map(row => row[colIdx]))
    );

    // Reject puzzles with any complete lines (lines with only one possible arrangement)
    if (!hasNoCompleteLines(rowClues, colClues, size)) {
      continue;
    }

    // Check for unique solution
    // Use SAT solver for smaller grids (more thorough), constraint propagation for larger
    const solutionCount = size <= SAT_SOLVER_MAX_SIZE
      ? countSolutionsSAT(rowClues, colClues, size)
      : countSolutions(rowClues, colClues, size);

    if (solutionCount === 1) {
      // Analyze information flow to ensure interesting solve path
      const flowAnalysis = analyzeInformationFlow(rowClues, colClues, size);
      const minScore = MIN_FLOW_SCORE[difficulty] || 0.2;

      if (flowAnalysis.metrics.flowScore >= minScore) {
        return {
          solution,
          rowClues,
          colClues,
          size,
          flowScore: flowAnalysis.metrics.flowScore,
        };
      }
      // If flow score is too low, try again for a more interesting puzzle
    }
  }

  // Fallback: return last attempt even if not unique
  console.warn(`Could not generate unique ${difficulty} ${size}x${size} puzzle after`, maxAttempts, 'attempts');
  const solution = Array(size).fill(null).map(() =>
    Array(size).fill(null).map(() => Math.random() < density)
  );
  const rowClues = solution.map(row => getCluesFromLine(row));
  const colClues = Array(size).fill(null).map((_, colIdx) =>
    getCluesFromLine(solution.map(row => row[colIdx]))
  );
  return { solution, rowClues, colClues, size };
};

// Create an empty player grid
export const createEmptyGrid = (size) => {
  return Array(size).fill(null).map(() => Array(size).fill(null));
};

/**
 * Generate a puzzle optimized for interesting information flow.
 * Generates multiple candidates and returns the one with the best flow score.
 */
export const generateOptimalFlowPuzzle = (size, difficulty = 'medium', candidateCount = 10) => {
  const density = DENSITY_BY_DIFFICULTY[difficulty] || 0.5;
  const maxAttemptsPerCandidate = 20;

  let bestPuzzle = null;
  let bestFlowScore = -1;

  for (let candidate = 0; candidate < candidateCount; candidate++) {
    for (let attempt = 0; attempt < maxAttemptsPerCandidate; attempt++) {
      const solution = Array(size).fill(null).map(() =>
        Array(size).fill(null).map(() => Math.random() < density)
      );

      // Ensure every row has at least one filled cell
      solution.forEach(row => {
        if (!row.some(cell => cell)) {
          row[Math.floor(Math.random() * size)] = true;
        }
      });

      // Ensure every column has at least one filled cell
      for (let col = 0; col < size; col++) {
        if (!solution.some(row => row[col])) {
          solution[Math.floor(Math.random() * size)][col] = true;
        }
      }

      const rowClues = solution.map(row => getCluesFromLine(row));
      const colClues = Array(size).fill(null).map((_, colIdx) =>
        getCluesFromLine(solution.map(row => row[colIdx]))
      );

      // Reject puzzles with any complete lines (lines with only one possible arrangement)
      if (!hasNoCompleteLines(rowClues, colClues, size)) {
        continue;
      }

      // Check for unique solution
      const solutionCount = size <= SAT_SOLVER_MAX_SIZE
        ? countSolutionsSAT(rowClues, colClues, size)
        : countSolutions(rowClues, colClues, size);

      if (solutionCount === 1) {
        const flowAnalysis = analyzeInformationFlow(rowClues, colClues, size);
        const flowScore = flowAnalysis.metrics.flowScore;

        if (flowScore > bestFlowScore) {
          bestFlowScore = flowScore;
          bestPuzzle = {
            solution,
            rowClues,
            colClues,
            size,
            flowScore,
            flowMetrics: flowAnalysis.metrics,
          };
        }
        break; // Found a valid puzzle for this candidate, move to next
      }
    }
  }

  if (bestPuzzle) {
    return bestPuzzle;
  }

  // Fallback to regular generation
  return generatePuzzle(size, difficulty);
};
