# Rubik’s Cube Solver

A tiny web app that lets you input a 54‑character cube state and returns the shortest solution using the **Kociemba two‑phase algorithm**.

> The project is built with React + TypeScript, bundled by Vite. It ships with ESLint and Vitest for linting and unit testing.

## Features
- **Interactive UI** – paste or type a cube state string (U,R,F,D,L,B order) in the textarea.
- **Solve button** – triggers the solver and displays the sequence of moves.
- **Error handling** – shows friendly messages if the input is invalid or no solution can be found.
- **Extensible** – replace the placeholder move‑application logic with a full 3×3 cube simulator when needed.

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
Example of a solved cube: `WWWWWWWWWYYYYYYYYYYYGGGGGGGGGBBBBBBBBBRRRRRRRRROOOOOOOO`.

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
  - `engine/` contains the cube state helpers and a thin wrapper around the `kociemba` npm package.
  - `App.tsx` is the main UI component.
- **public/** – static assets.
- **vite.config.ts** – Vite configuration (React plugin, build options).

## Contributing
Feel free to open issues or pull requests. If you add new features, remember to update the README and tests accordingly.

---
© 2026 Rubik’s Cube Solver Project
