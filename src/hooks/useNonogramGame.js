import { useState, useEffect, useRef, useCallback } from 'react';
import { generatePuzzle, createEmptyGrid } from '../utils/puzzleGenerator';
import { analyzeLine } from '../utils/lineAnalysis';
import { getLogicalHint } from '../utils/hints';

export const useNonogramGame = (initialSize = 5) => {
  const [gridSize, setGridSize] = useState(initialSize);
  const [puzzle, setPuzzle] = useState(null);
  const [playerGrid, setPlayerGrid] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [validationMessage, setValidationMessage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(null);
  const [history, setHistory] = useState([]);
  const dragGridRef = useRef(null);

  // Check if puzzle is solved
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

    setIsComplete(allFilledCorrect);
  }, []);

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
  const newGame = useCallback((size) => {
    const actualSize = size ?? gridSize;
    const newPuzzle = generatePuzzle(actualSize);
    setPuzzle(newPuzzle);
    setPlayerGrid(createEmptyGrid(actualSize));
    setIsComplete(false);
    setHistory([]);
    setValidationMessage(null);
  }, [gridSize]);

  // Undo last action
  const undo = useCallback(() => {
    if (history.length === 0) return;

    const previousGrid = history[history.length - 1];
    setPlayerGrid(previousGrid);
    setHistory(prev => prev.slice(0, -1));
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

  // Give a logical hint (deduced from constraints) or random if none available
  // Only reveals one cell at a time (no auto-fill cascade)
  const giveHint = useCallback(() => {
    if (!puzzle || isComplete) return;

    saveToHistory(playerGrid);
    const newGrid = playerGrid.map(r => [...r]);

    // Try to find a logically deducible cell first
    const logicalHint = getLogicalHint(playerGrid, puzzle.rowClues, puzzle.colClues);

    if (logicalHint) {
      newGrid[logicalHint.row][logicalHint.col] = logicalHint.value;
      setPlayerGrid(newGrid);
      checkCompletion(newGrid, puzzle);
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
    }
  }, [puzzle, isComplete, playerGrid, saveToHistory, checkCompletion]);

  // Validate current state
  const validate = useCallback(() => {
    if (!puzzle) return;

    let hasError = false;

    playerGrid.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (cell !== null && cell !== (puzzle.solution[i][j] ? 1 : 0)) {
          hasError = true;
        }
      });
    });

    setValidationMessage(hasError ? 'mistakes' : 'correct');
    setTimeout(() => setValidationMessage(null), 3000);
  }, [puzzle, playerGrid]);

  // Handle size change
  const handleSizeChange = useCallback((newSize) => {
    setGridSize(newSize);
    newGame(newSize);
  }, [newGame]);

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
    isComplete,
    validationMessage,
    history,
    newGame,
    undo,
    giveHint,
    validate,
    handleMouseDown,
    handleMouseEnter,
    handleMouseUp,
    handleRightClick,
    handleSizeChange,
  };
};
