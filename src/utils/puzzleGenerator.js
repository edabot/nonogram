import { getCluesFromLine } from './clues';
import { countSolutions } from './solver';

// Density settings by difficulty
const DENSITY_BY_DIFFICULTY = {
  easy: 0.65,
  medium: 0.50,
  hard: 0.35,
};

// Generate a random puzzle with unique solution
export const generatePuzzle = (size, difficulty = 'medium') => {
  // For large grids, skip uniqueness check as it's too slow
  const skipUniquenessCheck = size > 15;
  const maxAttempts = skipUniquenessCheck ? 1 : 100;
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

    if (skipUniquenessCheck) {
      return { solution, rowClues, colClues, size };
    }

    // Check for unique solution
    const solutionCount = countSolutions(rowClues, colClues, size);
    if (solutionCount === 1) {
      return { solution, rowClues, colClues, size };
    }
  }

  // Fallback: return last attempt even if not unique
  console.warn('Could not generate unique puzzle after', maxAttempts, 'attempts');
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
