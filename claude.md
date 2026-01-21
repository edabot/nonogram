# Nonogram Puzzle Game

A React-based nonogram (picross) puzzle game with automatic puzzle generation and solving assistance.

## Tech Stack

- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Testing**: Vitest

## Project Structure

```
src/
├── main.jsx              # App entry point
├── index.css             # Tailwind imports
├── NonogramGame.jsx      # Main game component
├── hooks/
│   └── useNonogramGame.js    # Game state and logic hook
└── utils/
    ├── clues.js              # Clue calculation and arrangement generation
    ├── solver.js             # Puzzle solver for uniqueness validation
    ├── puzzleGenerator.js    # Random puzzle generation
    ├── hints.js              # Logical hint deduction
    ├── lineAnalysis.js       # Line analysis for clue completion
    └── lineAnalysis.test.js  # Tests for line analysis
```

## Architecture

### Game Flow

1. **Puzzle Generation** (`puzzleGenerator.js`): Creates random grids ensuring unique solutions
2. **Player Interaction** (`useNonogramGame.js`): Manages grid state, history, and user input
3. **Rendering** (`NonogramGame.jsx`): Displays grid, clues, and controls

### Core Algorithms

#### Clue Generation (`clues.js`)
- `getCluesFromLine()`: Counts consecutive filled cells to produce clue numbers
- `generateArrangements()`: Recursively generates all valid cell arrangements for given clues

#### Solver (`solver.js`)
- `countSolutions()`: Uses constraint propagation + backtracking to verify unique solutions
- Returns 0, 1, or 2 (meaning "more than 1") for efficiency

#### Hint System (`hints.js`)
- `findDeducibleCells()`: Finds cells that can be logically determined from current state
- `deduceCellsInLine()`: Analyzes valid arrangements to find cells where all arrangements agree
- `getLogicalHint()`: Returns a single logical hint, prioritizing fills over X marks

#### Line Analysis (`lineAnalysis.js`)
- `analyzeLine()`: Determines completed clues and cells to mark as X
- `isClueCompleted()`: Checks if a specific clue is definitively satisfied
- `areAllCluesComplete()`: Checks if all clues in a line are complete
- Clues are marked complete only when bounded by X's or edges on both sides

### State Management

The `useNonogramGame` hook manages:
- `puzzle`: Current puzzle with solution, clues, and size
- `playerGrid`: Player's current state (null = unknown, 0 = marked X, 1 = filled)
- `history`: Undo stack for reverting actions
- `isComplete`: Whether puzzle is solved
- `validationMessage`: Feedback from validation

### User Interactions

- **Click**: Cycle through states (empty → filled → X → empty)
- **Drag**: Fill multiple cells with same value
- **Undo**: Ctrl+Z or button
- **Hint**: Reveals one logically deducible cell, falls back to random if none
- **Validate**: Checks for mistakes against solution
- **New Game**: Generates new puzzle
- **Size Selection**: 5x5, 8x8, 10x10, or 15x15

### Auto-fill Behavior

When player releases mouse after dragging:
1. `autoFillComplete()` runs in a loop
2. Analyzes each row and column
3. Automatically marks X's where all valid arrangements agree the cell must be empty
4. Repeats until no more cells can be auto-filled

### Clue Display

Clues fade to gray when completed. A clue is considered complete when:
1. All valid arrangements place that clue's group at the same position
2. The group is bounded by X's or grid edges on both sides

## Running the Project

```bash
npm install
npm run dev      # Start dev server
npm run test     # Run tests in watch mode
npm run build    # Production build
```
