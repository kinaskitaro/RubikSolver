// src/engine/cubeState.ts

/**
 * Cube state representation: a 54‑character string of colors.
 * Face order: U R F D L B (row‑major per face).
 */
type CubeState = string;
export type { CubeState };

export const FACE_ORDER = ['U', 'R', 'F', 'D', 'L', 'B'] as const;
type FaceName = typeof FACE_ORDER[number];

export const HOME_COLORS: Record<FaceName, string> = {
  U: 'W', // White
  R: 'R', // Red
  F: 'G', // Green
  D: 'Y', // Yellow
  L: 'O', // Orange
  B: 'B', // Blue
};

const FACE_START: Record<FaceName, number> = { U: 0, R: 9, F: 18, D: 27, L: 36, B: 45 };

/** Create a solved cube state */
export function createSolvedCube(): CubeState {
  return FACE_ORDER.map((f) => HOME_COLORS[f].repeat(9)).join('');
}

/** Deep clone – strings are immutable, so just return the same string */
export const cloneCube = (s: CubeState): CubeState => s;

import { Cube, initSolver } from 'rubik-solver';

let solverInitialized = false;
const colorToFace: Record<string, string> = {
  W: 'U', R: 'R', G: 'F', Y: 'D', O: 'L', B: 'B',
};
const faceToColor: Record<string, string> = {
  U: 'W', R: 'R', F: 'G', D: 'Y', L: 'O', B: 'B',
};

function toFacelet(state: CubeState): string {
  return state.split('').map((c) => colorToFace[c]).join('');
}
function fromFacelet(facelet: string): CubeState {
  return facelet.split('').map((f) => faceToColor[f]).join('');
}

/** Apply a single move to a cube state. */
export function applyMove(state: CubeState, mv: string): CubeState {
  const base = mv[0];
  if (!['U', 'R', 'F', 'D', 'L', 'B'].includes(base)) {
    throw new Error(`Unknown move "${mv}"`);
  }
  const suffix = mv.slice(1);
  if (suffix && !"'2".includes(suffix)) {
    throw new Error(`Unknown move "${mv}"`);
  }

  // Convert to facelet string.
  const facelet = toFacelet(state);
  // Ensure solver tables are initialized.
  if (!solverInitialized) {
    initSolver();
    solverInitialized = true;
  }
  const c = Cube.fromString(facelet);
  c.move(mv);
  const newFacelet = c.asString();
  return fromFacelet(newFacelet);
}

/** Apply a sequence of moves */
export function applyMoves(state: CubeState, seq: string[]): CubeState {
  return seq.reduce(applyMove, state);
}

/** Check if the cube is solved: every face uniform **and** in its home color. */
export function isSolved(state: CubeState): boolean {
  if (state.length !== 54) return false;
  for (const f of FACE_ORDER) {
    const segment = state.slice(FACE_START[f], FACE_START[f] + 9);
    // Uniformity
    if (!segment.split('').every(ch => ch === segment[0])) return false;
    // Correct home color
    if (segment[0] !== HOME_COLORS[f]) return false;
  }
  return true;
}

/** Validate a cube state: exactly 54 chars and exactly 9 of each color. */
export function validateCube(state: CubeState): boolean {
  if (state.length !== 54) return false;
  const counts: Record<string, number> = { W:0,Y:0,G:0,B:0,R:0,O:0 };
  for (const ch of state) {
    if (!(ch in counts)) return false;
    counts[ch]++;
  }
  return Object.values(counts).every(n => n === 9);
}

/** Serialize – identity */
export function serializeCube(state: CubeState): string { return state; }

/** Deserialize and validate a cube state string. Throws on invalid input. */
export function deserializeCube(str: CubeState): CubeState {
  if (!validateCube(str)) {
    throw new Error(`Invalid cube state: expected 54 characters with exactly 9 of each color (W Y G B R O), got ${str.length} characters`);
  }
  return str;
}
