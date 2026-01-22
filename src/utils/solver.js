import { generateArrangements } from './clues';

// Check if puzzle has a unique solution using constraint propagation
// Returns: 0 (no solution), 1 (unique), or 2 (multiple/undetermined)
export const countSolutions = (rowClues, colClues, size) => {
  // Grid: null = unknown, true = filled, false = empty
  const grid = Array(size).fill(null).map(() => Array(size).fill(null));

  // Get valid arrangements for a line given current state
  const getValidArrangements = (clues, line) => {
    return generateArrangements(clues, line.length).filter(arr =>
      line.every((cell, i) => cell === null || cell === arr[i])
    );
  };

  // Propagate constraints until no more changes
  const propagate = () => {
    let changed = true;
    let iterations = 0;
    const maxIterations = size * size; // Safety limit

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      // Process rows
      for (let r = 0; r < size; r++) {
        const row = grid[r];
        const valid = getValidArrangements(rowClues[r], row);

        if (valid.length === 0) return false; // No valid arrangement = invalid

        for (let c = 0; c < size; c++) {
          if (row[c] === null) {
            const allTrue = valid.every(arr => arr[c] === true);
            const allFalse = valid.every(arr => arr[c] === false);

            if (allTrue) {
              grid[r][c] = true;
              changed = true;
            } else if (allFalse) {
              grid[r][c] = false;
              changed = true;
            }
          }
        }
      }

      // Process columns
      for (let c = 0; c < size; c++) {
        const col = grid.map(row => row[c]);
        const valid = getValidArrangements(colClues[c], col);

        if (valid.length === 0) return false; // No valid arrangement = invalid

        for (let r = 0; r < size; r++) {
          if (grid[r][c] === null) {
            const allTrue = valid.every(arr => arr[r] === true);
            const allFalse = valid.every(arr => arr[r] === false);

            if (allTrue) {
              grid[r][c] = true;
              changed = true;
            } else if (allFalse) {
              grid[r][c] = false;
              changed = true;
            }
          }
        }
      }
    }

    return true; // Valid state (possibly incomplete)
  };

  // Run constraint propagation
  if (!propagate()) {
    return 0; // No solution
  }

  // Check if fully solved
  const hasUnknown = grid.some(row => row.some(cell => cell === null));

  if (!hasUnknown) {
    return 1; // Unique solution (solved purely by propagation)
  }

  // If there are still unknowns, the puzzle might have multiple solutions
  // or require guessing. For puzzle generation, we treat this as "not unique"
  return 2;
};
