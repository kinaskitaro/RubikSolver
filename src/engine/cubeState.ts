// src/engine/cubeState.ts

/**
 * Cube state representation: a 54‑character string.
 * Order of faces: U, R, F, D, L, B. Each face has 9 stickers.
 */
type CubeState = string;
export type { CubeState };

const FACE_ORDER = ['U', 'R', 'F', 'D', 'L', 'B'];
const COLORS: Record<string,string> = {
  U:'W', // White
  D:'Y', // Yellow
  F:'G', // Green
  B:'B', // Blue
  R:'R', // Red
  L:'O'  // Orange
};
/** Create a solved cube state */
export function createSolvedCube(): CubeState {
  return FACE_ORDER.map(f=>COLORS[f].repeat(9)).join('');
}
/** Deep clone – strings are immutable, so just return the same string */
export const cloneCube = (s: CubeState): CubeState => s;
/** Simple placeholder for applying a move. Throws if unknown. */
const MOVE_MAPS: Record<string,string[]> = {
  // For now only U and its variants are defined.
  'U': ['0','1','2','3','4','5','6','7','8'],
  "U'": [],
  'U2': []
};
export function applyMove(state: CubeState, mv: string): CubeState {
  if (!MOVE_MAPS[mv]) throw new Error(`Unknown move ${mv}`);
  // placeholder – return state unchanged
  return state;
}
/** Apply a sequence of moves */
export function applyMoves(state: CubeState, seq: string[]): CubeState {
  return seq.reduce(applyMove, state);
}
/** Check if cube is solved (all faces uniform) */
export function isSolved(state: CubeState): boolean {
  for (const f of FACE_ORDER) {
    const seg = state.slice(FACE_ORDER.indexOf(f)*9,(FACE_ORDER.indexOf(f)+1)*9);
    if (!/^[WYGBROR]*$/.test(seg)) return false;
    if (new Set(seg).size !== 1) return false;
  }
  return true;
}
/** Serialize / deserialize – identity for now */
export function serializeCube(state: CubeState): string {return state;}
export function deserializeCube(str: string): CubeState {
  if (str.length!==54) throw new Error('Invalid cube string');
  return str;
}
