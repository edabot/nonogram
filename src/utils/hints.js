import { generateArrangements } from './clues';

// Find cells that can be logically deduced from current state
// Returns: { cellsToFill: [{row, col}], cellsToMark: [{row, col}] }
export const findDeducibleCells = (playerGrid, rowClues, colClues) => {
  const size = playerGrid.length;
  const cellsToFill = [];
  const cellsToMark = [];

  // Check each row
  for (let row = 0; row < size; row++) {
    const line = playerGrid[row];
    const clues = rowClues[row];
    const deduced = deduceCellsInLine(line, clues);

    for (const idx of deduced.mustBeFilled) {
      if (playerGrid[row][idx] === null) {
        cellsToFill.push({ row, col: idx });
      }
    }
    for (const idx of deduced.mustBeEmpty) {
      if (playerGrid[row][idx] === null) {
        cellsToMark.push({ row, col: idx });
      }
    }
  }

  // Check each column
  for (let col = 0; col < size; col++) {
    const line = playerGrid.map(r => r[col]);
    const clues = colClues[col];
    const deduced = deduceCellsInLine(line, clues);

    for (const idx of deduced.mustBeFilled) {
      if (playerGrid[idx][col] === null) {
        const exists = cellsToFill.some(c => c.row === idx && c.col === col);
        if (!exists) {
          cellsToFill.push({ row: idx, col });
        }
      }
    }
    for (const idx of deduced.mustBeEmpty) {
      if (playerGrid[idx][col] === null) {
        const exists = cellsToMark.some(c => c.row === idx && c.col === col);
        if (!exists) {
          cellsToMark.push({ row: idx, col });
        }
      }
    }
  }

  return { cellsToFill, cellsToMark };
};

// Analyze a single line to find cells that must be filled or empty
const deduceCellsInLine = (line, clues) => {
  const length = line.length;
  const mustBeFilled = [];
  const mustBeEmpty = [];

  // Generate all valid arrangements that match current state
  const validArrangements = generateArrangements(clues, length).filter(arr =>
    line.every((cell, i) => cell === null || (cell === 1 ? arr[i] : !arr[i]))
  );

  if (validArrangements.length === 0) {
    return { mustBeFilled, mustBeEmpty };
  }

  // For each unknown cell, check if all valid arrangements agree
  for (let i = 0; i < length; i++) {
    if (line[i] === null) {
      const allFilled = validArrangements.every(arr => arr[i]);
      const allEmpty = validArrangements.every(arr => !arr[i]);

      if (allFilled) {
        mustBeFilled.push(i);
      } else if (allEmpty) {
        mustBeEmpty.push(i);
      }
    }
  }

  return { mustBeFilled, mustBeEmpty };
};

// Get a single logical hint (prioritizes filled cells over X marks)
export const getLogicalHint = (playerGrid, rowClues, colClues) => {
  const { cellsToFill, cellsToMark } = findDeducibleCells(playerGrid, rowClues, colClues);

  // Prioritize filling cells over marking X's (more helpful to player)
  if (cellsToFill.length > 0) {
    return { ...cellsToFill[0], value: 1, type: 'fill' };
  }

  if (cellsToMark.length > 0) {
    return { ...cellsToMark[0], value: 0, type: 'mark' };
  }

  return null;
};
