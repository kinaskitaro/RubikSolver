# Knowledge Base — cube-solver

> Generated from a full read of the repository on 2026-10-29; updated after Phase 0 (2026-10-29). Use this as the single reference for the project's structure, data model, conventions, and known gaps.

## 1. Project Overview

- **What**: A tiny web app that accepts a 54-character cube state string and returns a shortest solution using the **Kociemba two-phase algorithm** (via the `rubik-solver` npm package).
- **Stack**: React 19 + TypeScript (~6.0), Vite 8 (bundler mode), Vitest 5 (happy-dom + v8 coverage) for tests, ESLint 10 (flat config) for linting. Solver: **`rubik-solver`** (pure-TS Kociemba two-phase). The original native `kociemba` package was removed — it ships no Windows prebuild and this machine has no MSVC to build it.
- **Scripts** (`package.json`):
  - `npm run dev` — Vite dev server (http://localhost:5173)
  - `npm run build` — `tsc -b && vite build` → `dist/`
  - `npm test` — `vitest run --coverage`
  - `npm run lint` — `eslint .`
  - `npm run preview` — preview production build

## 2. File Inventory

| File | Purpose |
|---|---|
| `src/main.tsx` | App entry: `StrictMode`, renders `<App/>` into `#root`, imports `index.css`. |
| `src/App.tsx` | Main UI: textarea holding the 54-char state (initialized with a solved cube), **Solve** button, error `<pre>`, solution list with move count. |
| `src/engine/cubeState.ts` | Cube state helpers: solved-cube creation, clone, move application (placeholder), solved check, (de)serialization. |
| `src/engine/solverAdapter.ts` | Async solver: validates the 54-char color state, maps colors→face letters (W→U, R→R, G→F, Y→D, O→L, B→B), `Cube.fromString`, `initSolver()` (one-time ~1.3 s), returns `Promise<string[]>`. Solved input → `[]`; invalid input or no solution ≤ 22 → throws. |
| `src/test/cubeState.test.ts` | Vitest tests: solved-cube creation + `isSolved`, `cloneCube` identity. |
| `src/setupTests.ts` | Vitest setup: imports `@testing-library/jest-dom`. |
| `src/index.css`, `src/App.css` | Mostly Vite scaffold boilerplate (CSS vars, dark mode, `.counter`/`.hero`/`#next-steps` classes that App.tsx no longer uses). |
| `index.html` | Vite HTML shell, favicon from `/favicon.svg`. |
| `vite.config.ts` | React plugin only. |
| `vitest.config.ts` | React plugin, `globals: true`, `happy-dom` environment, setup file. |
| `tsconfig.json` | Solution file referencing `tsconfig.app.json` (src) and `tsconfig.node.json` (vite.config.ts). |
| `tsconfig.app.json` | Target ES2023, `moduleResolution: bundler`, `verbatimModuleSyntax`, `noUnusedLocals/Parameters`, `erasableSyntaxOnly`, `jsx: react-jsx`, no emit. |
| `eslint.config.js` | Flat config: JS recommended + TS recommended + react-hooks + react-refresh; browser globals. |
| `public/` | `favicon.svg`, `icons.svg`. |
| `src/assets/` | `hero.png`, `react.svg`, `vite.svg` (scaffold leftovers, not referenced by App). |

## 3. Cube Data Model

- **Representation**: a 54-char string, faces in order **U R F D L B**, 9 stickers each.
- **Color mapping** (in `cubeState.ts`):
  - `W` White = U, `Y` Yellow = D, `G` Green = F, `B` Blue = B, `R` Red = R, `O` Orange = L.
- **Solved cube**: `WWWWWWWWWYYYYYYYYYYYGGGGGGGGGBBBBBBBBBRRRRRRRRROOOOOOOO`.
- **Solver input contract**: `kociemba.solve(state)` expects exactly this URFDLB 54-char string and returns a move string like `"R U R' U'"`.

## 4. Key Functions

In `src/engine/cubeState.ts`:

- `createSolvedCube(): CubeState` — builds the solved string.
- `cloneCube(s)` — identity (strings are immutable).
- `applyMove(state, mv)` — **placeholder**: returns state unchanged; `MOVE_MAPS` only defines `'U'` (with `U'` and `U2` as empty arrays). Any other move throws `Unknown move`.
- `applyMoves(state, seq)` — reduce over `applyMove`.
- `isSolved(state)` — true if every face segment is uniform (single character). Note: it checks uniformity only, not that each face has the *correct* color; also the regex check is redundant with the `Set` size check.
- `serializeCube` / `deserializeCube` — identity; `deserialize` throws `'Invalid cube string'` if length ≠ 54.

In `src/engine/solverAdapter.ts`:

- `solveCube(state): Promise<string[]>` — validates (length 54 + sticker alphabet), maps to face-letter facelets, `Cube.fromString` → `initSolver()` → `solve(cube)` (Kociemba two-phase, max depth 22). Returns `[]` for a solved cube; throws on invalid state or when no solution ≤ 22 moves.
- **`rubik-solver` quirks**: `initSolver()` is required before `solve()`, `scramble()` **and `move()`** (library docs omit `move()`); facelet order is U R F D L B with face letters, not colors.

## 5. UI Flow (App.tsx)

1. Textarea starts with a solved cube string; user can paste any 54-char state.
2. **Solve** → `solveCube(cube).catch(() => null)`.
3. If result is null/empty → error text *"No solution found or cube is already solved"*; otherwise show `Solution (n)` and the joined move list.
4. Outer `try/catch` sets `String(e)` as the error — effectively dead code because `.catch(() => null)` already swallows rejections.

## 6. Testing & Conventions

- Vitest with **globals enabled** and **happy-dom**; tests live in `src/test/`.
- Current coverage: only `createSolvedCube`, `isSolved`, `cloneCube`. No tests for `applyMove`, `deserializeCube`, or `solveCube`.
- Strict TypeScript: `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` (type-only imports must use `import type`), `erasableSyntaxOnly`, `noFallthroughCasesInSwitch`.
- ESLint flat config; `dist` ignored.
- `.gitignore`: node_modules, dist, logs, editor files.

## 7. Known Gaps / Issues (as of 2026-10-29)

1. **`applyMove` is a stub** — no real 3×3 sticker permutation logic; the README itself notes this is a placeholder to be replaced with a full simulator.
2. **Misleading error handling in the UI** — `solveCube` now throws precise errors (bad length, bad sticker, no solution ≤ 22), but `App.tsx` still swallows them via `.catch(() => null)` and shows "No solution found or cube is already solved". `deserializeCube` is never called in the UI, so its length validation is unused.
3. **`isSolved` is weak** — a cube with uniform but wrong-colored faces (e.g., all stickers `W`) would pass.
4. **Validation only lives in the adapter** — `solveCube` now validates length + alphabet, but `cubeState.ts` has no `validateCube`, and the App relies on the adapter's thrown errors.
5. **Boilerplate leftovers** — `App.css`/`index.css` and `src/assets/*` are unused Vite scaffold artifacts.
6. **No test coverage** for the solver adapter or move application.

## 8. Extension Points

- Implement real sticker permutations in `applyMove` (U/R/F/D/L/B face turn maps) to enable a full simulator.
- Wire `deserializeCube` (or a `validateCube` check) into `App.tsx` before calling `solveCube` for friendlier errors.
- Add tests for `applyMoves`, `solveCube` (mock `kociemba`), and input validation.
- Consider memoizing/async-ifying solving and showing a progress indicator (kociemba can take a moment on hard states).
