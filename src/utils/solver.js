import { getCluesFromLine, generateArrangements } from './clues';

// Solve puzzle and count solutions (returns 0, 1, or 2 meaning "more than 1")
export const countSolutions = (rowClues, colClues, size) => {
  const grid = Array(size).fill(null).map(() => Array(size).fill(null));

  const getValidArrangements = (clues, line) => {
    const arrangements = generateArrangements(clues, line.length);
    return arrangements.filter(arr =>
      line.every((cell, i) => cell === null || cell === arr[i])
    );
  };

  const propagate = () => {
    let changed = true;
    while (changed) {
      changed = false;

      for (let r = 0; r < size; r++) {
        const row = grid[r];
        const valid = getValidArrangements(rowClues[r], row);
        if (valid.length === 0) return false;

        for (let c = 0; c < size; c++) {
          if (row[c] === null) {
            const allTrue = valid.every(arr => arr[c] === true);
            const allFalse = valid.every(arr => arr[c] === false);
            if (allTrue) { grid[r][c] = true; changed = true; }
            else if (allFalse) { grid[r][c] = false; changed = true; }
          }
        }
      }

      for (let c = 0; c < size; c++) {
        const col = grid.map(row => row[c]);
        const valid = getValidArrangements(colClues[c], col);
        if (valid.length === 0) return false;

        for (let r = 0; r < size; r++) {
          if (grid[r][c] === null) {
            const allTrue = valid.every(arr => arr[r] === true);
            const allFalse = valid.every(arr => arr[r] === false);
            if (allTrue) { grid[r][c] = true; changed = true; }
            else if (allFalse) { grid[r][c] = false; changed = true; }
          }
        }
      }
    }
    return true;
  };

  const solve = () => {
    if (!propagate()) return 0;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === null) {
          let count = 0;

          const backup = grid.map(row => [...row]);
          grid[r][c] = true;
          count += solve();
          if (count > 1) return count;

          for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
              grid[i][j] = backup[i][j];
            }
          }
          grid[r][c] = false;
          count += solve();
          return Math.min(count, 2);
        }
      }
    }

    for (let r = 0; r < size; r++) {
      const rowResult = getCluesFromLine(grid[r]);
      if (rowResult.join(',') !== rowClues[r].join(',')) return 0;
    }
    for (let c = 0; c < size; c++) {
      const col = grid.map(row => row[c]);
      const colResult = getCluesFromLine(col);
      if (colResult.join(',') !== colClues[c].join(',')) return 0;
    }
    return 1;
  };

  return solve();
};
