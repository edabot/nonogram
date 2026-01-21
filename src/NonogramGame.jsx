import { useNonogramGame } from './hooks/useNonogramGame';
import { isClueCompleted, areAllCluesComplete } from './utils/lineAnalysis';

const NonogramGame = () => {
  const {
    puzzle,
    playerGrid,
    gridSize,
    difficulty,
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
    handleDifficultyChange,
  } = useNonogramGame(8, 'medium');

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
              Undo (Ctrl+Z)
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
            <select
              value={gridSize}
              onChange={(e) => handleSizeChange(Number(e.target.value))}
              className="px-4 py-2 border-2 border-indigo-300 rounded-lg focus:outline-none focus:border-indigo-500"
            >
              <option value={8}>8x8</option>
              <option value={10}>10x10</option>
              <option value={15}>15x15</option>
              <option value={20}>20x20</option>
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

          {validationMessage && (
            <div className={`mb-4 p-4 border-2 rounded-lg text-center ${
              validationMessage === 'mistakes'
                ? 'bg-red-100 border-red-500'
                : 'bg-green-100 border-green-500'
            }`}>
              <p className={`text-lg font-semibold ${
                validationMessage === 'mistakes' ? 'text-red-800' : 'text-green-800'
              }`}>
                {validationMessage === 'mistakes' ? 'There are some mistakes!' : 'Looking good so far!'}
              </p>
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
                    return (
                    <div
                      key={colIdx}
                      onMouseDown={() => handleMouseDown(rowIdx, colIdx)}
                      onMouseEnter={() => handleMouseEnter(rowIdx, colIdx)}
                      onContextMenu={(e) => handleRightClick(rowIdx, colIdx, e)}
                      className={`w-7 h-7 border border-gray-400 cursor-pointer transition-all hover:border-indigo-500 select-none ${
                        cell === 1
                          ? 'bg-indigo-900'
                          : cell === 0
                          ? 'bg-gray-200'
                          : 'bg-white'
                      }`}
                      style={{
                        borderRightWidth: isRightBoundary ? '2px' : undefined,
                        borderRightColor: isRightBoundary ? '#1e1b4b' : undefined,
                        borderBottomWidth: isBottomBoundary ? '2px' : undefined,
                        borderBottomColor: isBottomBoundary ? '#1e1b4b' : undefined,
                      }}
                    >
                      {cell === 0 && (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
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
