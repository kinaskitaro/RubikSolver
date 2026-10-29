// src/engine/solverAdapter.ts
import { Cube, initSolver, solve } from 'rubik-solver';

/**
 * Our app stores cube state as 54 color characters in U R F D L B order:
 *   W=White(U)  R=Red(R)  G=Green(F)  Y=Yellow(D)  O=Orange(L)  B=Blue(B)
 * rubik-solver expects face letters (U R F D L B) in the same order, so we
 * map each color to its face letter before parsing.
 */
const COLOR_TO_FACE: Record<string, string> = {
  W: 'U',
  R: 'R',
  G: 'F',
  Y: 'D',
  O: 'L',
  B: 'B',
};

const VALID_COLORS = Object.keys(COLOR_TO_FACE);

function toFaceletString(state: string): string {
  if (state.length !== 54) {
    throw new Error(`Invalid cube state: expected 54 characters, got ${state.length}`);
  }
  let out = '';
  for (const ch of state) {
    const face = COLOR_TO_FACE[ch];
    if (!face) {
      throw new Error(`Invalid sticker "${ch}" — expected one of ${VALID_COLORS.join(', ')}`);
    }
    out += face;
  }
  return out;
}

/**
 * Solve a cube state string (54 colors, U R F D L B order) using the
 * Kociemba two-phase algorithm (via `rubik-solver`).
 * @returns list of moves (e.g. ["R","U","R'","U'"]) or [] when already solved.
 * @throws when the input is not a valid 54-char color state, or when no
 *         solution exists within the default depth of 22 moves.
 */
export async function solveCube(state: string): Promise<string[]> {
  const facelet = toFaceletString(state);
  const cube = Cube.fromString(facelet);
  // One-time table precomputation (~1-2 s); later calls are no-ops.
  // Also required before move()/scramble() (library docs omit this).
  initSolver();
  if (cube.isSolved()) return [];
  const seq = solve(cube);
  if (seq === null) {
    throw new Error('No solution found within 22 moves');
  }
  return seq.split(' ').filter(Boolean);
}
