import { useState } from 'react';
import { useNonogramGame } from './hooks/useNonogramGame';
import { isClueCompleted, areAllCluesComplete } from './utils/lineAnalysis';
import { generatePuzzle } from './utils/puzzleGenerator';

const SIZES = [10, 15, 20, 25];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

// Generate all permutations of size and difficulty
const PERMUTATIONS = SIZES.flatMap(size =>
  DIFFICULTIES.map(difficulty => ({
    name: `${difficulty} ${size}x${size}`,
    size,
    difficulty,
  }))
);

const SpeedTestPopup = ({ onClose }) => {
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState(null);

  const runSpeedTest = async () => {
    setRunning(true);
    setResults(null);
    const newResults = [];

    for (const perm of PERMUTATIONS) {
      setCurrentTest(perm.name);

      // Use setTimeout to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 10));

      const start = performance.now();
      generatePuzzle(perm.size, perm.difficulty);
      const end = performance.now();

      newResults.push({
        name: perm.name,
        time: end - start,
      });

      setResults([...newResults]);
    }

    setCurrentTest(null);
    setRunning(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4 w-full">
        <h2 className="text-xl font-bold text-center mb-4 text-indigo-900">Speed Test</h2>

        {!results && !running && (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Generate one puzzle for each size/difficulty combination and measure generation time.
            </p>
            <div className="mb-4 text-left bg-gray-50 rounded p-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Permutations:</p>
              <ul className="text-sm text-gray-600 grid grid-cols-2 gap-1">
                {PERMUTATIONS.map(p => (
                  <li key={p.name}>{p.name}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {running && currentTest && (
          <div className="text-center mb-4">
            <div className="animate-pulse text-indigo-600 font-medium">
              Running: {currentTest}...
            </div>
          </div>
        )}

        {results && (
          <div className="mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-gray-700">Configuration</th>
                  <th className="text-right py-2 text-gray-700">Time</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.name} className="border-b border-gray-100">
                    <td className="py-2 text-gray-800">{r.name}</td>
                    <td className="py-2 text-right font-mono text-gray-600">
                      {r.time.toFixed(0)}ms
                    </td>
                  </tr>
                ))}
              </tbody>
              {results.length === PERMUTATIONS.length && (
                <tfoot>
                  <tr className="font-medium">
                    <td className="py-2 text-gray-800">Total</td>
                    <td className="py-2 text-right font-mono text-indigo-600">
                      {results.reduce((sum, r) => sum + r.time, 0).toFixed(0)}ms
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={runSpeedTest}
            disabled={running}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {running ? 'Running...' : results ? 'Run Again' : 'Run Speed Test'}
          </button>
          <button
            onClick={onClose}
            disabled={running}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const NonogramGame = () => {
  const [showSpeedTest, setShowSpeedTest] = useState(false);

  const {
    puzzle,
    playerGrid,
    gridSize,
    difficulty,
    isComplete,
    validationMessage,
    showValidationPopup,
    mistakes,
    history,
    newGame,
    undo,
    giveHint,
    validate,
    closeValidationPopup,
    showMistakes,
    removeMistakes,
    clearMistakes,
    showSolution,
    hintCell,
    handleMouseDown,
    handleMouseEnter,
    handleMouseUp,
    handleRightClick,
    handleSizeChange,
    handleDifficultyChange,
  } = useNonogramGame(10, 'medium');

  // Check if a cell is marked as a mistake
  const isMistake = (row, col) => {
    return mistakes.some(m => m.row === row && m.col === col);
  };

  // Check if a cell is the recently hinted cell
  const isHintCell = (row, col) => {
    return hintCell && hintCell.row === row && hintCell.col === col;
  };

  if (!puzzle) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const maxRowClues = Math.max(...puzzle.rowClues.map(c => c.length));
  const maxColClues = Math.max(...puzzle.colClues.map(c => c.length));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-indigo-900">Nonogram Puzzle</h1>

        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex gap-4 mb-4 flex-wrap justify-center">
            <button
              onClick={() => newGame()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              New Puzzle
            </button>
            <button
              onClick={undo}
              disabled={history.length === 0}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Undo
            </button>
            <button
              onClick={giveHint}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Hint
            </button>
            <button
              onClick={validate}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Validate
            </button>
            <button
              onClick={showSolution}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Show Solution
            </button>
            <button
              onClick={() => setShowSpeedTest(true)}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              Speed Test
            </button>
            <select
              value={gridSize}
              onChange={(e) => handleSizeChange(Number(e.target.value))}
              className="px-4 py-2 border-2 border-indigo-300 rounded-lg focus:outline-none focus:border-indigo-500"
            >
              <option value={10}>10x10</option>
              <option value={15}>15x15</option>
              <option value={20}>20x20</option>
              <option value={25}>25x25</option>
            </select>
            <select
              value={difficulty}
              onChange={(e) => handleDifficultyChange(e.target.value)}
              className="px-4 py-2 border-2 border-indigo-300 rounded-lg focus:outline-none focus:border-indigo-500"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {isComplete && (
            <div className="mb-4 p-4 bg-green-100 border-2 border-green-500 rounded-lg text-center">
              <p className="text-xl font-bold text-green-800">Congratulations! Puzzle Complete!</p>
            </div>
          )}

          {/* Mistake highlighting controls */}
          {mistakes.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg flex items-center justify-center gap-4">
              <span className="text-red-800 font-medium">{mistakes.length} mistake{mistakes.length > 1 ? 's' : ''} highlighted</span>
              <button
                onClick={removeMistakes}
                className="px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
              >
                Remove Mistakes
              </button>
              <button
                onClick={clearMistakes}
                className="px-4 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition text-sm"
              >
                Hide Highlighting
              </button>
            </div>
          )}

          {/* Speed Test Popup */}
          {showSpeedTest && (
            <SpeedTestPopup onClose={() => setShowSpeedTest(false)} />
          )}

          {/* Validation Popup Modal */}
          {showValidationPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4">
                <div className={`text-center mb-4 ${validationMessage === 'mistakes' ? 'text-red-600' : 'text-green-600'}`}>
                  <div className="text-5xl mb-2">
                    {validationMessage === 'mistakes' ? '✗' : '✓'}
                  </div>
                  <h2 className="text-xl font-bold">
                    {validationMessage === 'mistakes' ? 'Mistakes Found' : 'Looking Good!'}
                  </h2>
                  <p className="text-gray-600 mt-2">
                    {validationMessage === 'mistakes'
                      ? 'There are some incorrect cells in your puzzle.'
                      : 'No mistakes so far. Keep going!'}
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  {validationMessage === 'mistakes' && (
                    <button
                      onClick={showMistakes}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      Show Mistakes
                    </button>
                  )}
                  <button
                    onClick={closeValidationPopup}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <div className="inline-block" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
              {/* Column clues */}
              <div className="flex" style={{ marginLeft: `${maxRowClues * 28}px` }}>
                {puzzle.colClues.map((clues, colIdx) => (
                  <div key={colIdx} className="flex flex-col items-center justify-end" style={{ width: '28px', height: `${maxColClues * 20}px` }}>
                    {clues.map((clue, clueIdx) => {
                      const col = playerGrid.map(row => row[colIdx]);
                      const allComplete = areAllCluesComplete(col, clues);
                      const completed = allComplete || isClueCompleted(col, clueIdx, clues);
                      return (
                        <div
                          key={clueIdx}
                          className={`text-xs font-semibold mb-1 transition-colors ${
                            completed ? 'text-gray-400' : 'text-indigo-900'
                          }`}
                        >
                          {clue}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Grid with row clues */}
              {playerGrid.map((row, rowIdx) => (
                <div key={rowIdx} className="flex items-center">
                  {/* Row clues */}
                  <div className="flex items-center justify-end" style={{ width: `${maxRowClues * 28}px`, height: '28px' }}>
                    {puzzle.rowClues[rowIdx].map((clue, clueIdx) => {
                      const allComplete = areAllCluesComplete(row, puzzle.rowClues[rowIdx]);
                      const completed = allComplete || isClueCompleted(row, clueIdx, puzzle.rowClues[rowIdx]);
                      return (
                        <div
                          key={clueIdx}
                          className={`text-sm font-semibold mr-2 transition-colors ${
                            completed ? 'text-gray-400' : 'text-indigo-900'
                          }`}
                        >
                          {clue}
                        </div>
                      );
                    })}
                  </div>

                  {/* Grid cells */}
                  {row.map((cell, colIdx) => {
                    const isRightBoundary = (colIdx + 1) % 5 === 0 && colIdx < row.length - 1;
                    const isBottomBoundary = (rowIdx + 1) % 5 === 0 && rowIdx < playerGrid.length - 1;
                    const cellIsMistake = isMistake(rowIdx, colIdx);
                    const cellIsHint = isHintCell(rowIdx, colIdx);
                    return (
                    <div
                      key={colIdx}
                      onMouseDown={() => handleMouseDown(rowIdx, colIdx)}
                      onMouseEnter={() => handleMouseEnter(rowIdx, colIdx)}
                      onContextMenu={(e) => handleRightClick(rowIdx, colIdx, e)}
                      className={`w-7 h-7 border cursor-pointer transition-all duration-500 hover:border-indigo-500 select-none ${
                        cellIsMistake
                          ? 'bg-red-500 border-red-600'
                          : cellIsHint
                          ? 'bg-green-500 border-green-600'
                          : cell === 1
                          ? 'bg-indigo-900 border-gray-400'
                          : cell === 0
                          ? 'bg-gray-200 border-gray-400'
                          : 'bg-white border-gray-400'
                      }`}
                      style={{
                        borderRightWidth: isRightBoundary ? '2px' : undefined,
                        borderRightColor: isRightBoundary ? '#1e1b4b' : undefined,
                        borderBottomWidth: isBottomBoundary ? '2px' : undefined,
                        borderBottomColor: isBottomBoundary ? '#1e1b4b' : undefined,
                      }}
                    >
                      {cell === 0 && !cellIsHint && (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                          ×
                        </div>
                      )}
                      {cell === 0 && cellIsHint && (
                        <div className="w-full h-full flex items-center justify-center text-white text-xs">
                          ×
                        </div>
                      )}
                    </div>
                  );})}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Left-click to fill cells, right-click to mark as empty (×).</p>
            <p>Click and drag to fill multiple cells.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NonogramGame;
