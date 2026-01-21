import { getCluesFromLine } from './clues';
import { countSolutions } from './solver';

// Generate a random puzzle with unique solution
export const generatePuzzle = (size) => {
  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const solution = Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => Math.random() > 0.5)
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

    // Check for unique solution
    const solutionCount = countSolutions(rowClues, colClues, size);
    if (solutionCount === 1) {
      return { solution, rowClues, colClues, size };
    }
  }

  // Fallback: return last attempt even if not unique
  console.warn('Could not generate unique puzzle after', maxAttempts, 'attempts');
  const solution = Array(size).fill(null).map(() =>
    Array(size).fill(null).map(() => Math.random() > 0.5)
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
