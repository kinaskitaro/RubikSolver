# Rubik’s Cube Solver

A tiny web app that lets you input a 54‑character cube state and returns the shortest solution using the **Kociemba two‑phase algorithm**.

> The project is built with React + TypeScript, bundled by Vite. It ships with ESLint and Vitest for linting and unit testing.

## Features
- **Interactive UI** – paste or type a 54‑character cube state string (URFDLB order) into the textarea on the right.
- **3D visual cube view** – the cube is rendered as an interactive CSS‑3D model that stays coherent for any valid state; it spins gently at idle and pauses while solving, in input mode, or when you hover over it.
- **Paint Colors (manual scramble builder)** – click “🎨 Paint Colors”, pick a color from the palette (W/Y/G/B/R/O) plus an eraser, then click stickers directly on the 3D cube to hand‑build a scrambled state. Escape exits input mode.
- **Solve button** – triggers the Kociemba two‑phase solver and displays the shortest move sequence.
- **Scramble / Reset** buttons, a solution stepper (apply one move at a time with progress `i/n`), and an “Apply Move” row to apply typed moves directly.
- **Error handling** – validates input (54 characters, exactly 9 of each color) before solving and shows friendly messages for invalid stickers, unsolvable states, or already‑solved cubes.
- A loading indicator (“Solving…”) appears while the solver runs on hard states.
- State (current cube and solution) persists in `localStorage`, so you can resume where you left off after a reload.

## Cube representation
The solver expects a string of length 54, composed of the six face colors in this order:
```
U R F D L B
```
Each face contributes nine characters. The default mapping used by the project is:
```
W – White (Up)
Y – Yellow (Down)
G – Green (Front)
B – Blue  (Back)
R – Red   (Right)
O – Orange(Left)
```
Example of a solved cube: `WWWWWWWWWRRRRRRRRRGGGGGGGGGYYYYYYYYYYOOOOOOOOBBBBBBBBB` (U=W, R=R, F=G, D=Y, L=O, B=B).

## Getting started
```bash
# Clone the repo
git clone https://github.com/your-username/cube-solver.git
cd cube-solver

# Install dependencies
npm install

# Run in development mode (HMR enabled)
npm run dev
# Open http://localhost:5173 in your browser.
```

## Building for production
```bash
npm run build
# The output is in the `dist/` folder and can be served by any static server.
```

## Testing & linting
```bash
# Run unit tests (uses Vitest)
npm test

# Lint the codebase
npm run lint
```

## Project structure
- **src/** – React components and cube‑solver engine.
  - `engine/` contains the cube state helpers and a thin wrapper around the `rubik-solver` npm package (pure‑TS Kociemba two‑phase solver; the original native `kociemba` package was dropped because it ships no Windows prebuild).
  - `App.tsx` is the main UI component.
- **public/** – static assets.
- **vite.config.ts** – Vite configuration (React plugin, build options).

## Contributing
Feel free to open issues or pull requests. If you add new features, remember to update the README and tests accordingly.

---
© 2026 Rubik’s Cube Solver Project
<EOF>