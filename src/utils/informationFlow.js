import { generateArrangements } from './clues';

/**
 * Analyze the information flow of a puzzle by simulating a logical solve.
 * Returns detailed metrics about how deductions spread across the grid.
 */
export const analyzeInformationFlow = (rowClues, colClues, size) => {
  // Start with empty grid (null = unknown)
  const grid = Array(size).fill(null).map(() => Array(size).fill(null));

  const waves = []; // Each wave is a set of deductions made in one pass
  let totalDeductions = 0;

  // Simulate solving step by step
  let waveNumber = 0;
  const maxWaves = size * size; // Safety limit

  while (waveNumber < maxWaves) {
    const deductions = findDeductionsForGrid(grid, rowClues, colClues, size);

    if (deductions.length === 0) break;

    // Record this wave
    waves.push({
      waveNumber,
      deductions: deductions.map(d => ({
        row: d.row,
        col: d.col,
        value: d.value,
        source: d.source, // 'row' or 'col'
        sourceIndex: d.sourceIndex,
        quadrant: getQuadrant(d.row, d.col, size),
      })),
    });

    // Apply deductions to grid
    for (const d of deductions) {
      grid[d.row][d.col] = d.value;
      totalDeductions++;
    }

    waveNumber++;
  }

  // Check if puzzle was fully solved
  const solved = grid.every(row => row.every(cell => cell !== null));

  // Calculate metrics
  const metrics = calculateMetrics(waves, size, solved);

  return {
    waves,
    totalDeductions,
    totalWaves: waves.length,
    solved,
    metrics,
  };
};

/**
 * Find all cells that can be deduced in the current state.
 * Similar to findDeducibleCells but tracks the source of each deduction.
 */
const findDeductionsForGrid = (grid, rowClues, colClues, size) => {
  const deductions = [];
  const seen = new Set();

  const addDeduction = (row, col, value, source, sourceIndex) => {
    const key = `${row},${col}`;
    if (!seen.has(key) && grid[row][col] === null) {
      seen.add(key);
      deductions.push({ row, col, value, source, sourceIndex });
    }
  };

  // Check rows
  for (let r = 0; r < size; r++) {
    const line = grid[r];
    const clues = rowClues[r];
    const validArrangements = getValidArrangements(clues, line);

    if (validArrangements.length === 0) continue;

    for (let c = 0; c < size; c++) {
      if (line[c] === null) {
        const allFilled = validArrangements.every(arr => arr[c]);
        const allEmpty = validArrangements.every(arr => !arr[c]);

        if (allFilled) addDeduction(r, c, true, 'row', r);
        else if (allEmpty) addDeduction(r, c, false, 'row', r);
      }
    }
  }

  // Check columns
  for (let c = 0; c < size; c++) {
    const line = grid.map(row => row[c]);
    const clues = colClues[c];
    const validArrangements = getValidArrangements(clues, line);

    if (validArrangements.length === 0) continue;

    for (let r = 0; r < size; r++) {
      if (grid[r][c] === null) {
        const allFilled = validArrangements.every(arr => arr[r]);
        const allEmpty = validArrangements.every(arr => !arr[r]);

        if (allFilled) addDeduction(r, c, true, 'col', c);
        else if (allEmpty) addDeduction(r, c, false, 'col', c);
      }
    }
  }

  return deductions;
};

/**
 * Get valid arrangements for a line given current state.
 */
const getValidArrangements = (clues, line) => {
  return generateArrangements(clues, line.length).filter(arr =>
    line.every((cell, i) => cell === null || cell === arr[i])
  );
};

/**
 * Determine which quadrant a cell is in (0-3 for 2x2 grid of quadrants).
 */
const getQuadrant = (row, col, size) => {
  const midRow = size / 2;
  const midCol = size / 2;

  if (row < midRow && col < midCol) return 0; // Top-left
  if (row < midRow && col >= midCol) return 1; // Top-right
  if (row >= midRow && col < midCol) return 2; // Bottom-left
  return 3; // Bottom-right
};

/**
 * Calculate metrics about the information flow.
 */
const calculateMetrics = (waves, size, solved) => {
  if (waves.length === 0) {
    return {
      entryPoints: 0,
      quadrantSpread: 0,
      quadrantSwitches: 0,
      spatialVariance: 0,
      flowScore: 0,
    };
  }

  // Entry points: number of deductions in the first wave
  const entryPoints = waves[0]?.deductions.length || 0;

  // Quadrant analysis
  const quadrantsByWave = waves.map(w => {
    const quads = new Set(w.deductions.map(d => d.quadrant));
    return Array.from(quads);
  });

  // Quadrant spread: average number of quadrants active per wave
  const quadrantSpread = quadrantsByWave.reduce((sum, quads) => sum + quads.length, 0) / waves.length;

  // Quadrant switches: count how often the "focus" quadrant changes
  let quadrantSwitches = 0;
  let prevDominantQuadrant = null;

  for (const wave of waves) {
    // Find dominant quadrant in this wave (most deductions)
    const quadrantCounts = [0, 0, 0, 0];
    for (const d of wave.deductions) {
      quadrantCounts[d.quadrant]++;
    }
    const dominantQuadrant = quadrantCounts.indexOf(Math.max(...quadrantCounts));

    if (prevDominantQuadrant !== null && dominantQuadrant !== prevDominantQuadrant) {
      quadrantSwitches++;
    }
    prevDominantQuadrant = dominantQuadrant;
  }

  // Spatial variance: how spread out are deductions within each wave?
  let totalVariance = 0;
  for (const wave of waves) {
    if (wave.deductions.length < 2) continue;

    const positions = wave.deductions.map(d => ({ row: d.row, col: d.col }));
    const avgRow = positions.reduce((s, p) => s + p.row, 0) / positions.length;
    const avgCol = positions.reduce((s, p) => s + p.col, 0) / positions.length;

    const variance = positions.reduce((s, p) => {
      return s + Math.pow(p.row - avgRow, 2) + Math.pow(p.col - avgCol, 2);
    }, 0) / positions.length;

    totalVariance += variance;
  }
  const spatialVariance = waves.length > 0 ? totalVariance / waves.length : 0;

  // Normalized spatial variance (0-1 scale based on max possible variance)
  const maxVariance = (size * size) / 2; // Rough approximation
  const normalizedVariance = Math.min(spatialVariance / maxVariance, 1);

  // Combined flow score (higher = more interesting information flow)
  // Weights can be tuned based on what makes puzzles fun
  const flowScore = calculateFlowScore({
    entryPoints,
    quadrantSpread,
    quadrantSwitches,
    normalizedVariance,
    totalWaves: waves.length,
    solved,
    size,
  });

  return {
    entryPoints,
    quadrantSpread: Math.round(quadrantSpread * 100) / 100,
    quadrantSwitches,
    spatialVariance: Math.round(spatialVariance * 100) / 100,
    flowScore: Math.round(flowScore * 100) / 100,
  };
};

/**
 * Calculate a combined score representing puzzle quality based on information flow.
 * Higher scores indicate puzzles with more interesting solve paths.
 */
const calculateFlowScore = ({ entryPoints, quadrantSpread, quadrantSwitches, normalizedVariance, totalWaves, solved, size }) => {
  if (!solved) return 0; // Unsolvable puzzles get 0

  // Ideal entry points: not too few (frustrating), not too many (trivial)
  // Sweet spot is around 10-20% of grid size
  const idealEntryPoints = size * 0.4;
  const entryPointScore = 1 - Math.abs(entryPoints - idealEntryPoints) / idealEntryPoints;

  // Quadrant spread: higher is better (working across the grid)
  const spreadScore = quadrantSpread / 4; // Max is 4 quadrants

  // Quadrant switches: more switches = more interesting
  // Normalize by number of waves
  const switchScore = totalWaves > 1 ? quadrantSwitches / (totalWaves - 1) : 0;

  // Spatial variance: higher is better (deductions spread out)
  const varianceScore = normalizedVariance;

  // Number of waves: more waves = more back-and-forth (to a point)
  // Ideal is roughly proportional to grid size
  const idealWaves = size * 0.8;
  const waveScore = Math.min(totalWaves / idealWaves, 1.5) / 1.5;

  // Weighted combination
  const score = (
    Math.max(0, entryPointScore) * 0.15 +
    spreadScore * 0.25 +
    switchScore * 0.30 +
    varianceScore * 0.15 +
    waveScore * 0.15
  );

  return score;
};

/**
 * Generate a detailed report of the information flow for debugging/visualization.
 */
export const getFlowReport = (flowAnalysis) => {
  const { waves, totalDeductions, totalWaves, solved, metrics } = flowAnalysis;

  const lines = [
    `Solved: ${solved}`,
    `Total waves: ${totalWaves}`,
    `Total deductions: ${totalDeductions}`,
    ``,
    `Metrics:`,
    `  Entry points (wave 0): ${metrics.entryPoints}`,
    `  Avg quadrants per wave: ${metrics.quadrantSpread}`,
    `  Quadrant switches: ${metrics.quadrantSwitches}`,
    `  Spatial variance: ${metrics.spatialVariance}`,
    `  Flow score: ${metrics.flowScore}`,
    ``,
    `Wave breakdown:`,
  ];

  for (const wave of waves) {
    const quadrants = [...new Set(wave.deductions.map(d => d.quadrant))];
    const fills = wave.deductions.filter(d => d.value).length;
    const empties = wave.deductions.filter(d => !d.value).length;
    lines.push(`  Wave ${wave.waveNumber}: ${wave.deductions.length} deductions (${fills} fills, ${empties} X's) in quadrants [${quadrants.join(',')}]`);
  }

  return lines.join('\n');
};
