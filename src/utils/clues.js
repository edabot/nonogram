// Calculate clues from a line of cells
export const getCluesFromLine = (line) => {
  const clues = [];
  let count = 0;

  for (let i = 0; i < line.length; i++) {
    if (line[i]) {
      count++;
    } else if (count > 0) {
      clues.push(count);
      count = 0;
    }
  }
  if (count > 0) clues.push(count);

  return clues.length > 0 ? clues : [0];
};

// Generate all valid arrangements for a line given its clues
export const generateArrangements = (clues, length) => {
  if (clues.length === 1 && clues[0] === 0) {
    return [Array(length).fill(false)];
  }

  const arrangements = [];

  const generate = (clueIdx, pos, current) => {
    if (clueIdx === clues.length) {
      const result = [...current];
      while (result.length < length) result.push(false);
      arrangements.push(result);
      return;
    }

    const clue = clues[clueIdx];
    const remainingClues = clues.slice(clueIdx + 1);
    const minSpaceNeeded = remainingClues.reduce((a, b) => a + b + 1, 0);
    const maxStart = length - clue - minSpaceNeeded;

    for (let start = pos; start <= maxStart; start++) {
      const next = [...current];
      while (next.length < start) next.push(false);
      for (let i = 0; i < clue; i++) next.push(true);
      if (clueIdx < clues.length - 1) next.push(false);
      generate(clueIdx + 1, next.length, next);
    }
  };

  generate(0, 0, []);
  return arrangements;
};
