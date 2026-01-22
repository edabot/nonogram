import Logic from 'logic-solver';

/**
 * SAT-based solver for nonogram puzzles
 *
 * Encodes the puzzle as a boolean satisfiability problem:
 * - Each cell (r,c) becomes a boolean variable
 * - Row/column clues are encoded as constraints requiring exactly
 *   one valid arrangement per line
 */

// Generate variable name for cell at (row, col)
const cellVar = (row, col) => `cell_${row}_${col}`;

// Generate all valid arrangements for a line given its clues
const generateArrangements = (clues, length) => {
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

/**
 * Encode a line constraint into the SAT solver
 *
 * For each line, we create auxiliary variables for each valid arrangement
 * and require exactly one arrangement to be selected.
 * Then we link the arrangement selection to the cell variables.
 */
const encodeLineConstraint = (solver, clues, length, getCellVar, lineId) => {
  const arrangements = generateArrangements(clues, length);

  if (arrangements.length === 0) {
    // No valid arrangements - unsatisfiable
    solver.require(Logic.FALSE);
    return;
  }

  if (arrangements.length === 1) {
    // Only one arrangement - directly set the cells
    const arr = arrangements[0];
    for (let i = 0; i < length; i++) {
      if (arr[i]) {
        solver.require(getCellVar(i));
      } else {
        solver.require(Logic.not(getCellVar(i)));
      }
    }
    return;
  }

  // Create auxiliary variable for each arrangement
  const arrVars = arrangements.map((_, idx) => `${lineId}_arr_${idx}`);

  // Exactly one arrangement must be selected
  solver.require(Logic.exactlyOne(...arrVars));

  // Link arrangement selection to cell values
  // If arrangement k is selected, then cell i must match arr[k][i]
  for (let i = 0; i < length; i++) {
    // For each cell position, determine which arrangements have it filled
    const filledInArrangements = [];
    const emptyInArrangements = [];

    for (let k = 0; k < arrangements.length; k++) {
      if (arrangements[k][i]) {
        filledInArrangements.push(arrVars[k]);
      } else {
        emptyInArrangements.push(arrVars[k]);
      }
    }

    const cellVariable = getCellVar(i);

    // If any "filled" arrangement is selected, cell must be true
    // If any "empty" arrangement is selected, cell must be false
    // This is: cell <=> OR(filled arrangements)
    if (filledInArrangements.length === 0) {
      // All arrangements have this cell empty
      solver.require(Logic.not(cellVariable));
    } else if (emptyInArrangements.length === 0) {
      // All arrangements have this cell filled
      solver.require(cellVariable);
    } else {
      // cell is true iff one of the "filled" arrangements is selected
      solver.require(Logic.equiv(cellVariable, Logic.or(...filledInArrangements)));
    }
  }
};

/**
 * Count solutions to a nonogram puzzle using SAT solver
 * Returns: 0 (no solution), 1 (unique), or 2 (multiple solutions)
 */
export const countSolutionsSAT = (rowClues, colClues, size) => {
  const solver = new Logic.Solver();

  // Encode row constraints
  for (let r = 0; r < size; r++) {
    encodeLineConstraint(
      solver,
      rowClues[r],
      size,
      (col) => cellVar(r, col),
      `row_${r}`
    );
  }

  // Encode column constraints
  for (let c = 0; c < size; c++) {
    encodeLineConstraint(
      solver,
      colClues[c],
      size,
      (row) => cellVar(row, c),
      `col_${c}`
    );
  }

  // Find first solution
  const sol1 = solver.solve();

  if (!sol1) {
    return 0; // No solution
  }

  // Block this solution and try to find another
  solver.forbid(sol1.getFormula());

  const sol2 = solver.solve();

  if (!sol2) {
    return 1; // Unique solution
  }

  return 2; // Multiple solutions
};

/**
 * Solve a nonogram puzzle and return the solution grid
 * Returns null if no solution exists
 */
export const solvePuzzleSAT = (rowClues, colClues, size) => {
  const solver = new Logic.Solver();

  // Encode row constraints
  for (let r = 0; r < size; r++) {
    encodeLineConstraint(
      solver,
      rowClues[r],
      size,
      (col) => cellVar(r, col),
      `row_${r}`
    );
  }

  // Encode column constraints
  for (let c = 0; c < size; c++) {
    encodeLineConstraint(
      solver,
      colClues[c],
      size,
      (row) => cellVar(row, c),
      `col_${c}`
    );
  }

  const solution = solver.solve();

  if (!solution) {
    return null;
  }

  // Extract solution grid
  const grid = Array(size).fill(null).map(() => Array(size).fill(false));

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      grid[r][c] = solution.evaluate(cellVar(r, c));
    }
  }

  return grid;
};
