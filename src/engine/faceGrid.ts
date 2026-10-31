// src/engine/faceGrid.ts
//
// Shared, deterministic mapping between the 54-char cube state and a visual
// per-face 3x3 grid. Both the Flat face-net view and any paint interaction use
// this so rendering stays coherent across rotations (the real move permutation
// is always handled by applyMove in cubeState.ts — this file only decides how a
// face's stickers are laid out on screen).

import { FACE_ORDER } from './cubeState';

/** Face indices 0..5 map to the URFDLB order used throughout the engine. */
export const FACE_LETTERS: readonly string[] = FACE_ORDER;

type Grid = string[][];

/**
 * Maps a face's flat index (0..8, row-major in the state string) to its [row,
 * col] position inside the visual 3x3 grid. The mapping is fixed per face so a
 * solved cube always renders as six solid colour squares and any valid scramble
 * stays legible after moves are applied. Only the back face (index 1) is flipped
 * because it is viewed from behind.
 */
export function slotFor(faceIndex: number, idx: number): [number, number] {
  const r = Math.floor(idx / 3);
  const c = idx % 3;
  if (faceIndex === 1) return [2 - r, 2 - c]; // back face viewed from behind
  return [r, c];
}

/** Build a visual 3x3 grid for one face's slice of the state string. */
export function getFaceGrid(state: string, faceIndex: number): { colors: string[]; grid: Grid } {
  const slice = state.slice(faceIndex * 9, faceIndex * 9 + 9).split('');
  const grid: Grid = Array.from({ length: 3 }, () => Array(3).fill(''));
  for (let i = 0; i < 9; i++) {
    const [r, c] = slotFor(faceIndex, i);
    grid[r][c] = slice[i];
  }
  return { colors: slice, grid };
}

/**
 * Inverse of {@link getFaceGrid}: maps a visual (face, row, col) back to the
 * flat index in the state string. Used by paint interactions so clicking a
 * sticker edits the correct character.
 */
export function buildPaintMap(): Map<string, number> {
  const map = new Map<string, number>();
  for (let f = 0; f < FACE_LETTERS.length; f++) {
    for (let i = 0; i < 9; i++) {
      const [r, c] = slotFor(f, i);
      map.set(`${f}:${r}:${c}`, f * 9 + i);
    }
  }
  return map;
}
