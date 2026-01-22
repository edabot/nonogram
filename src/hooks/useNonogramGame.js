import { useState, useEffect, useRef, useCallback } from 'react';
import { generatePuzzle, createEmptyGrid } from '../utils/puzzleGenerator';
import { analyzeLine } from '../utils/lineAnalysis';
import { getLogicalHint } from '../utils/hints';

export const useNonogramGame = (initialSize = 8, initialDifficulty = 'medium') => {
  const [gridSize, setGridSize] = useState(initialSize);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [puzzle, setPuzzle] = useState(null);
  const [playerGrid, setPlayerGrid] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [validationMessage, setValidationMessage] = useState(null);
  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const [mistakes, setMistakes] = useState([]); // Array of {row, col} for incorrect cells
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(null);
  const [history, setHistory] = useState([]);
  const [hintCell, setHintCell] = useState(null); // {row, col} of recently hinted cell
  const [stats, setStats] = useState({ hintsUsed: 0, undosUsed: 0, mistakesRemoved: 0 });
  const [startTime, setStartTime] = useState(null);
  const [completionTime, setCompletionTime] = useState(null);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const dragGridRef = useRef(null);
  const hintTimeoutRef = useRef(null);

  // Check if puzzle is solved (only for regular play, not show solution)
  const checkCompletion = useCallback((grid, currentPuzzle) => {
    if (!currentPuzzle) return;

    const allFilledCorrect = currentPuzzle.solution.every((row, i) =>
      row.every((shouldBeFilled, j) => {
        if (shouldBeFilled) {
          return grid[i][j] === 1;
        }
        return true;
      })
    );

    if (allFilledCorrect && !isComplete) {
      setIsComplete(true);
      setCompletionTime(Date.now() - startTime);
      setShowCompletionPopup(true);
    }
  }, [isComplete, startTime]);

  // Auto-fill X's based on line analysis
  const autoFillComplete = useCallback((grid, currentPuzzle) => {
    if (!currentPuzzle) return;

    let changed = true;
    while (changed) {
      changed = false;

      grid.forEach((row, rowIdx) => {
        const { cellsToMark } = analyzeLine(row, currentPuzzle.rowClues[rowIdx]);
        for (const col of cellsToMark) {
          if (grid[rowIdx][col] !== 0) {
            grid[rowIdx][col] = 0;
            changed = true;
          }
        }
      });

      for (let col = 0; col < currentPuzzle.size; col++) {
        const column = grid.map(row => row[col]);
        const { cellsToMark } = analyzeLine(column, currentPuzzle.colClues[col]);
        for (const row of cellsToMark) {
          if (grid[row][col] !== 0) {
            grid[row][col] = 0;
            changed = true;
          }
        }
      }
    }
  }, []);

  // Save current grid state to history
  const saveToHistory = useCallback((grid) => {
    setHistory(prev => [...prev, grid.map(row => [...row])]);
  }, []);

  // Initialize new game
  const newGame = useCallback((size, diff) => {
    const actualSize = size ?? gridSize;
    const actualDifficulty = diff ?? difficulty;
    const newPuzzle = generatePuzzle(actualSize, actualDifficulty);
    setPuzzle(newPuzzle);
    setPlayerGrid(createEmptyGrid(actualSize));
    setIsComplete(false);
    setHistory([]);
    setValidationMessage(null);
    setShowValidationPopup(false);
    setShowCompletionPopup(false);
    setMistakes([]);
    setStats({ hintsUsed: 0, undosUsed: 0, mistakesRemoved: 0 });
    setStartTime(Date.now());
    setCompletionTime(null);
  }, [gridSize, difficulty]);

  // Undo last action
  const undo = useCallback(() => {
    if (history.length === 0) return;

    const previousGrid = history[history.length - 1];
    setPlayerGrid(previousGrid);
    setHistory(prev => prev.slice(0, -1));
    setStats(prev => ({ ...prev, undosUsed: prev.undosUsed + 1 }));
    checkCompletion(previousGrid, puzzle);
  }, [history, puzzle, checkCompletion]);

  // Handle mouse down to start dragging
  const handleMouseDown = useCallback((row, col) => {
    if (isComplete) return;

    saveToHistory(playerGrid);

    const newGrid = playerGrid.map(r => [...r]);

    let newValue;
    if (newGrid[row][col] === null) {
      newValue = 1;
    } else if (newGrid[row][col] === 1) {
      newValue = 0;
    } else {
      newValue = null;
    }

    setDragValue(newValue);
    newGrid[row][col] = newValue;
    dragGridRef.current = newGrid;

    setIsDragging(true);
    setPlayerGrid(newGrid);
  }, [isComplete, playerGrid, saveToHistory]);

  // Handle mouse enter during drag
  const handleMouseEnter = useCallback((row, col) => {
    if (!isDragging || isComplete || !dragGridRef.current) return;

    dragGridRef.current[row][col] = dragValue;
    setPlayerGrid(dragGridRef.current.map(r => [...r]));
  }, [isDragging, isComplete, dragValue]);

  // Handle mouse up to end dragging
  const handleMouseUp = useCallback(() => {
    if (isDragging && dragGridRef.current && puzzle) {
      autoFillComplete(dragGridRef.current, puzzle);
      setPlayerGrid(dragGridRef.current.map(r => [...r]));
      checkCompletion(dragGridRef.current, puzzle);
    }
    setIsDragging(false);
    setDragValue(null);
    dragGridRef.current = null;
  }, [isDragging, puzzle, autoFillComplete, checkCompletion]);

  // Handle right click to mark X
  const handleRightClick = useCallback((row, col, e) => {
    e.preventDefault();
    if (isComplete) return;

    saveToHistory(playerGrid);
    const newGrid = playerGrid.map(r => [...r]);

    // Toggle between X and empty on right click
    newGrid[row][col] = newGrid[row][col] === 0 ? null : 0;

    autoFillComplete(newGrid, puzzle);
    setPlayerGrid(newGrid);
    checkCompletion(newGrid, puzzle);
  }, [isComplete, playerGrid, puzzle, saveToHistory, autoFillComplete, checkCompletion]);

  // Set hint cell with auto-clear after 2 seconds
  const setHintCellWithTimeout = useCallback((row, col) => {
    // Clear any existing timeout
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current);
    }
    setHintCell({ row, col });
    hintTimeoutRef.current = setTimeout(() => {
      setHintCell(null);
      hintTimeoutRef.current = null;
    }, 2000);
  }, []);

  // Give a logical hint (deduced from constraints) or random if none available
  // Only reveals one cell at a time (no auto-fill cascade)
  const giveHint = useCallback(() => {
    if (!puzzle || isComplete) return;

    saveToHistory(playerGrid);
    const newGrid = playerGrid.map(r => [...r]);
    setStats(prev => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));

    // Try to find a logically deducible cell first
    const logicalHint = getLogicalHint(playerGrid, puzzle.rowClues, puzzle.colClues);

    if (logicalHint) {
      newGrid[logicalHint.row][logicalHint.col] = logicalHint.value;
      setPlayerGrid(newGrid);
      checkCompletion(newGrid, puzzle);
      setHintCellWithTimeout(logicalHint.row, logicalHint.col);
      return;
    }

    // Fall back to revealing a random incorrect/empty cell from solution
    const emptyCells = [];
    playerGrid.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (cell === null || cell !== (puzzle.solution[i][j] ? 1 : 0)) {
          emptyCells.push([i, j]);
        }
      });
    });

    if (emptyCells.length > 0) {
      const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      newGrid[row][col] = puzzle.solution[row][col] ? 1 : 0;
      setPlayerGrid(newGrid);
      checkCompletion(newGrid, puzzle);
      setHintCellWithTimeout(row, col);
    }
  }, [puzzle, isComplete, playerGrid, saveToHistory, checkCompletion, setHintCellWithTimeout]);

  // Validate current state - shows popup
  const validate = useCallback(() => {
    if (!puzzle) return;

    const foundMistakes = [];

    playerGrid.forEach((row, i) => {
      row.forEach((cell, j) => {
        // A mistake is when player filled a cell that should be empty
        if (cell === 1 && !puzzle.solution[i][j]) {
          foundMistakes.push({ row: i, col: j });
        }
      });
    });

    setMistakes([]); // Clear any previous mistake highlighting
    setValidationMessage(foundMistakes.length > 0 ? 'mistakes' : 'correct');
    setShowValidationPopup(true);
  }, [puzzle, playerGrid]);

  // Close validation popup
  const closeValidationPopup = useCallback(() => {
    setShowValidationPopup(false);
    setValidationMessage(null);
  }, []);

  // Show mistakes - highlights incorrect cells
  const showMistakes = useCallback(() => {
    if (!puzzle) return;

    const foundMistakes = [];

    playerGrid.forEach((row, i) => {
      row.forEach((cell, j) => {
        // A mistake is when player filled a cell that should be empty
        if (cell === 1 && !puzzle.solution[i][j]) {
          foundMistakes.push({ row: i, col: j });
        }
      });
    });

    setMistakes(foundMistakes);
    setShowValidationPopup(false);
  }, [puzzle, playerGrid]);

  // Remove all mistakes from the grid
  const removeMistakes = useCallback(() => {
    if (!puzzle || mistakes.length === 0) return;

    saveToHistory(playerGrid);
    const newGrid = playerGrid.map(r => [...r]);

    for (const { row, col } of mistakes) {
      newGrid[row][col] = null;
    }

    setStats(prev => ({ ...prev, mistakesRemoved: prev.mistakesRemoved + mistakes.length }));
    setPlayerGrid(newGrid);
    setMistakes([]);
  }, [puzzle, playerGrid, mistakes, saveToHistory]);

  // Clear mistake highlighting
  const clearMistakes = useCallback(() => {
    setMistakes([]);
  }, []);

  // Close completion popup
  const closeCompletionPopup = useCallback(() => {
    setShowCompletionPopup(false);
  }, []);

  // Show solution (does not trigger completion popup)
  const showSolution = useCallback(() => {
    if (!puzzle) return;

    const solutionGrid = puzzle.solution.map(row =>
      row.map(cell => cell ? 1 : 0)
    );
    setPlayerGrid(solutionGrid);
    setIsComplete(true);
    // Don't show completion popup when solution is revealed
  }, [puzzle]);

  // Handle size change
  const handleSizeChange = useCallback((newSize) => {
    setGridSize(newSize);
    newGame(newSize, difficulty);
  }, [newGame, difficulty]);

  // Handle difficulty change
  const handleDifficultyChange = useCallback((newDifficulty) => {
    setDifficulty(newDifficulty);
    newGame(gridSize, newDifficulty);
  }, [newGame, gridSize]);

  // Initialize game on mount
  useEffect(() => {
    newGame();
  }, []);

  // Keyboard listener for Ctrl+Z
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  return {
    puzzle,
    playerGrid,
    gridSize,
    difficulty,
    isComplete,
    validationMessage,
    showValidationPopup,
    showCompletionPopup,
    mistakes,
    hintCell,
    history,
    stats,
    completionTime,
    newGame,
    undo,
    giveHint,
    validate,
    closeValidationPopup,
    closeCompletionPopup,
    showMistakes,
    removeMistakes,
    clearMistakes,
    showSolution,
    handleMouseDown,
    handleMouseEnter,
    handleMouseUp,
    handleRightClick,
    handleSizeChange,
    handleDifficultyChange,
  };
};
