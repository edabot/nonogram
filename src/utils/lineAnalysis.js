import { generateArrangements } from './clues';

// Find all groups of filled cells in a line
const findGroups = (line) => {
  const groups = [];
  let groupStart = -1;

  for (let i = 0; i < line.length; i++) {
    if (line[i] === 1) {
      if (groupStart === -1) groupStart = i;
    } else if (groupStart !== -1) {
      groups.push({ start: groupStart, end: i - 1, size: i - groupStart });
      groupStart = -1;
    }
  }
  if (groupStart !== -1) {
    groups.push({ start: groupStart, end: line.length - 1, size: line.length - groupStart });
  }

  return groups;
};

// Find valid arrangements that match current line state
const getValidArrangements = (line, clues) => {
  return generateArrangements(clues, line.length).filter(arr =>
    line.every((cell, i) => cell === null || (cell === 1 ? arr[i] : !arr[i]))
  );
};

// Find cells that must be X based on all valid arrangements
const findCellsToMark = (line, validArrangements) => {
  const cellsToMark = [];

  for (let i = 0; i < line.length; i++) {
    if (line[i] === null) {
      const allEmpty = validArrangements.every(arr => !arr[i]);
      if (allEmpty) {
        cellsToMark.push(i);
      }
    }
  }

  return cellsToMark;
};

// Extract groups from an arrangement (array of booleans)
const getGroupsFromArrangement = (arrangement) => {
  const groups = [];
  let groupStart = -1;

  for (let i = 0; i < arrangement.length; i++) {
    if (arrangement[i]) {
      if (groupStart === -1) groupStart = i;
    } else if (groupStart !== -1) {
      groups.push({ start: groupStart, end: i - 1 });
      groupStart = -1;
    }
  }
  if (groupStart !== -1) {
    groups.push({ start: groupStart, end: arrangement.length - 1 });
  }

  return groups;
};

// Determine which clues are definitively completed
// A clue is complete only if ALL valid arrangements agree on which group satisfies it
const findCompletedClues = (line, clues, validArrangements) => {
  const completedClues = new Array(clues.length).fill(false);

  if (validArrangements.length === 0) {
    return completedClues;
  }

  // For each clue, check if all valid arrangements place it at the same position
  for (let clueIdx = 0; clueIdx < clues.length; clueIdx++) {
    // Get the group position for this clue in the first arrangement
    const firstArrangementGroups = getGroupsFromArrangement(validArrangements[0]);
    if (clueIdx >= firstArrangementGroups.length) continue;

    const expectedGroup = firstArrangementGroups[clueIdx];

    // Check if all arrangements have this clue at the same position
    const allAgree = validArrangements.every(arr => {
      const groups = getGroupsFromArrangement(arr);
      if (clueIdx >= groups.length) return false;
      const group = groups[clueIdx];
      return group.start === expectedGroup.start && group.end === expectedGroup.end;
    });

    if (allAgree) {
      // Additionally verify the group is "locked in" - bounded by X or edge on both sides
      const group = expectedGroup;
      const leftBounded = group.start === 0 || line[group.start - 1] === 0;
      const rightBounded = group.end === line.length - 1 || line[group.end + 1] === 0;

      // Also verify the cells are actually filled in by the player
      let allFilled = true;
      for (let i = group.start; i <= group.end; i++) {
        if (line[i] !== 1) {
          allFilled = false;
          break;
        }
      }

      if (leftBounded && rightBounded && allFilled) {
        completedClues[clueIdx] = true;
      }
    }
  }

  return completedClues;
};

// Analyze a line to determine which clues are complete and where X's should go
// Returns: { completedClues: boolean[], cellsToMark: number[] }
export const analyzeLine = (line, clues) => {
  const validArrangements = getValidArrangements(line, clues);

  if (validArrangements.length === 0) {
    return { completedClues: new Array(clues.length).fill(false), cellsToMark: [] };
  }

  const cellsToMark = findCellsToMark(line, validArrangements);
  const completedClues = findCompletedClues(line, clues, validArrangements);

  return { completedClues, cellsToMark };
};

// Check if a specific clue is completed
export const isClueCompleted = (line, clueIndex, clues) => {
  const { completedClues } = analyzeLine(line, clues);
  return completedClues[clueIndex];
};

// Check if all clues in a line are complete
export const areAllCluesComplete = (line, clues) => {
  const { completedClues } = analyzeLine(line, clues);
  return completedClues.every(c => c);
};
