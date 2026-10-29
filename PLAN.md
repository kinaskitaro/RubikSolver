# Plan — cube-solver

Goal: a working, tested Rubik's Cube solver web app where the user can enter/scramble a cube, get a shortest Kociemba solution, and watch it applied move by move.

## Phase 0 — Baseline & verification ✅ DONE (2026-10-29)
- [x] `npm install`, `npm test`, `npm run lint`, `npm run build` all pass
- [x] Manually verify end-to-end: paste a scrambled state → Solve → get a move list
- [x] Verify the `kociemba` package API against its actual types/docs

**Findings & fixes made:**
1. **Native `kociemba` is unusable here** — ships only a `darwin-x64` prebuild; the `node-gyp rebuild` fallback was blocked and this machine has no MSVC (`cl`). The local `kociemba.d.ts` was also wrong (declared the default export *as* the solve fn, while the runtime API is `kociemba.solve`).
   → **Replaced with `rubik-solver`** (pure-TS Kociemba two-phase, MIT, ESM + types): `npm i rubik-solver`, removed `kociemba` + `kociemba.d.ts`, rewrote `solverAdapter.ts` (color→face-letter mapping W→U, R→R, G→F, Y→D, O→L, B→B; `initSolver()` once; solved input short-circuits to `[]`; throws on invalid state / no solution ≤ 22).
2. **`npm test` was red** — `@vitest/coverage-v8` missing → added to devDependencies.
3. **`npm run build` was red** — TS error from the stale `kociemba.d.ts` (fixed by #1).
4. **README's solved-cube example was wrong** (`W Y G B R O` in URFDLB order — not even a valid cube state) → corrected to `WWWWWWWWWRRRRRRRRRGGGGGGGGGYYYYYYYYYYOOOOOOOOBBBBBBBBB`.
5. **ESLint warned on generated `coverage/`** → added to `globalIgnores`.
6. **E2E verified in Node**: `initSolver()` ~1.3 s (one-time); 20-move scramble → 22-move solution in ~8 ms → applying it returns the cube to solved. `solve()` on a solved cube returns a 12-move null-algorithm (net identity) → adapter now returns `[]` for solved input.

**Library quirks to remember (`rubik-solver`):**
- `initSolver()` must run before `solve()`, `scramble()` **and `move()`** (docs omit `move()`); it builds the static move table.
- `new Cube().move(...)` before `initSolver()` throws — always init first (adapter does this).
- Facelet order is U R F D L B with **face letters**; our app uses **colors** — the mapping lives in `solverAdapter.ts`.
- **Exit:** ✅ baseline green — install/test/lint/build pass; solver happy path verified end-to-end.

## Phase 1 — Real cube engine (core)
Replace the `applyMove` stub in `src/engine/cubeState.ts`:
- [ ] Define the 54-sticker facelet model (URFDLB order, 9 stickers per face, row-major)
- [ ] Implement sticker permutations for all 18 moves: U R F D L B + `'` (counter-clockwise) + `2` (double) variants
- [ ] `applyMove` applies the real permutation; `applyMoves` unchanged
- [ ] Add `validateCube(state)`: length 54, exactly 9 of each color (W Y G B R O)
- [ ] Fix `isSolved`: each face uniform **and** in its correct home color
- **Exit:** engine is real; stub removed.

## Phase 2 — Solver integration & error handling
- [ ] Call `validateCube` in the UI (or in `solveCube`) before solving
- [ ] Distinct, friendly errors: invalid sticker set / bad length / already solved / unsolvable (parity) / solver failure
- [ ] Remove the dead outer `catch` and the `.catch(() => null)` swallowing in `App.tsx`
- [ ] Optional: wrap long solves in a "solving…" state
- **Exit:** every bad input produces a precise message; no silent failures.

## Phase 3 — Testing (run in parallel with Phases 1–2)
- [ ] Unit tests per move: applying `X`, `X'`, `X2` round-trips (X·X' = identity, X·X·X = X')
- [ ] Property test: random scramble (20–25 moves) + its inverse → solved cube
- [ ] Test `validateCube` (good, bad length, bad color counts)
- [ ] Test `solveCube` with a mocked `kociemba` (happy + throw paths)
- [ ] Component test `App.tsx` with Testing Library: solved state, valid solve, invalid input
- **Exit:** meaningful coverage across engine + adapter + UI.

## Phase 4 — UX upgrades
- [ ] Render the cube as a 6-face colored net (CSS grid of 54 stickers) from state
- [ ] **Scramble** button: generate 20–25 random moves, apply with the real engine, display result
- [ ] **Reset** button back to solved state
- [ ] Solution stepper: "Next move" button applies one move at a time (visual cube updates), with progress `i/n`
- [ ] Persist last state/solution in `localStorage`
- [ ] Accept move input from user too (type a move, see it applied) — nice-to-have
- **Exit:** app is usable end-to-end without touching the textarea.

## Phase 5 — Cleanup & docs
- [ ] Remove unused scaffold: `src/assets/*`, dead classes in `App.css`/`index.css`
- [ ] Update `README.md`: drop the "placeholder" wording, document the real features + color map
- [ ] Final gate: lint + tests + build green
- **Exit:** repo is honest about what it does, no dead code.

## Suggested task order (shortest path to a working app)
1. Phase 0 (baseline)
2. Phase 1 (engine) + Phase 3 engine tests
3. Phase 2 (errors)
4. Phase 4 (UX)
5. Phase 3 UI tests, then Phase 5

## Risks / notes
- Biggest risk: hand-written facelet permutations are easy to get wrong → mitigate with the round-trip and scramble-inverse property tests in Phase 3.
- `kociemba` solve can take a moment on hard states → keep the async wrapper, show a loading state.
- Keep URFDLB string as the single source of truth between UI, engine, and solver (no parallel representations).
