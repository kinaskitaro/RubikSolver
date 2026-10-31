import { describe, it, expect } from 'vitest';
import {
  createSolvedCube,
  isSolved,
  validateCube,
  applyMove,
  applyMoves,
  deserializeCube,
  cloneCube,
} from '../engine/cubeState';

const FACES = ['U', 'R', 'F', 'D', 'L', 'B'] as const;
const ALL_MOVES: string[] = FACES.flatMap((f) => [f, `${f}'`, `${f}2`]);

const COLOR_TO_FACE: Record<string, string> = { W: 'U', R: 'R', G: 'F', Y: 'D', O: 'L', B: 'B' };
const toFacelet = (state: string): string =>
  state
    .split('')
    .map((c) => COLOR_TO_FACE[c])
    .join('');

/** Deterministic PRNG so "random" tests are reproducible. */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomScramble(rand: () => number, length: number): string[] {
  const moves: string[] = [];
  for (let i = 0; i < length; i++) {
    const f = FACES[Math.floor(rand() * 6)];
    const s = ['', "'", '2'][Math.floor(rand() * 3)];
    moves.push(f + s);
  }
  return moves;
}

/** Inverse of a single move: X → X', X' → X, X2 → X2. */
function invert(mv: string): string {
  const base = mv[0];
  const s = mv.slice(1);
  if (s === "'") return base;
  if (s === '2') return `${base}2`;
  return `${base}'`;
}

describe('createSolvedCube', () => {
  it('returns 54 chars, 9 of each home color in URFDLB order', () => {
    const s = createSolvedCube();
    // 9 of each color (54 total); the handoff doc's example had a typo (10 Y + 8 O).
    expect(s).toBe('WWWWWWWWWRRRRRRRRRGGGGGGGGGYYYYYYYYYOOOOOOOOOBBBBBBBBB');
    expect(s.length).toBe(54);
  });
});

describe('validateCube', () => {
  it('accepts a valid state', () => {
    expect(validateCube(createSolvedCube())).toBe(true);
  });

  it('rejects wrong length', () => {
    expect(validateCube(createSolvedCube().slice(0, 53))).toBe(false);
    expect(validateCube(createSolvedCube() + 'W')).toBe(false);
  });

  it('rejects invalid characters', () => {
    expect(validateCube('X'.repeat(54))).toBe(false);
  });

  it('rejects 54 chars with wrong color counts', () => {
    const s = createSolvedCube().replace('W', 'R'); // 10 R, 8 W
    expect(validateCube(s)).toBe(false);
  });
});

describe('isSolved', () => {
  it('solved cube is solved', () => {
    expect(isSolved(createSolvedCube())).toBe(true);
  });

  it('one misplaced sticker is not solved', () => {
    const s = createSolvedCube().split('');
    s[0] = 'R';
    s[9] = 'W';
    expect(isSolved(s.join(''))).toBe(false);
  });

  it('uniform but wrong-colored faces are not solved', () => {
    // The old stub passed any uniform faces; a all-white cube is not solved.
    expect(isSolved('W'.repeat(54))).toBe(false);
    expect(isSolved('R'.repeat(54))).toBe(false);
  });

  it('rejects non-54 input', () => {
    expect(isSolved('WWW')).toBe(false);
  });
});

describe('applyMove — known geometry', () => {
  it('U on the solved cube cycles F→L→B→R top rows', () => {
    const after = applyMove(createSolvedCube(), 'U');
    expect(after.slice(0, 9)).toBe('W'.repeat(9)); // U face unchanged
    // Clockwise viewed from above: front→left→back→right (B→R→F→L).
    expect(after.slice(9, 12)).toBe('BBB'); // R top ← B top
    expect(after.slice(18, 21)).toBe('RRR'); // F top ← R top
    expect(after.slice(36, 39)).toBe('GGG'); // L top ← F top
    expect(after.slice(45, 48)).toBe('OOO'); // B top ← L top
  });

  it.each(FACES)('%s changes exactly 12 stickers of the solved cube', (f) => {
    const s = createSolvedCube();
    const after = applyMove(s, f);
    const changed = s.split('').filter((ch, i) => ch !== after[i]).length;
    // Only the 12 edge stickers around the layer change color; the 8 face-edge
    // stickers move among identical home colors (e.g. W→W), so they don't count.
    expect(changed).toBe(12);
  });
});

describe('applyMove — move algebra on a scrambled cube', () => {
  // A non-solved state is essential: on a solved cube every face is uniform,
  // so any permutation would look like the identity.
  const scrambled = applyMoves(createSolvedCube(), ['R', 'U', "F'", 'D2', 'L', "B'"]);

  it.each(ALL_MOVES)('%s followed by its inverse is the identity', (mv) => {
    expect(applyMove(applyMove(scrambled, mv), invert(mv))).toBe(scrambled);
  });

  it.each(ALL_MOVES)('%s applied four times is the identity', (mv) => {
    expect(applyMoves(scrambled, [mv, mv, mv, mv])).toBe(scrambled);
  });

  it.each(FACES)('%s applied three times equals %s\'', (f) => {
    expect(applyMoves(scrambled, [f, f, f])).toBe(applyMove(scrambled, `${f}'`));
  });
});

describe('applyMove — invalid moves throw', () => {
  it('unknown face throws', () => {
    expect(() => applyMove(createSolvedCube(), 'X')).toThrow(/Unknown move/);
  });

  it('bad suffix throws', () => {
    expect(() => applyMove(createSolvedCube(), "U''")).toThrow(/Unknown move/);
    expect(() => applyMove(createSolvedCube(), 'U3')).toThrow(/Unknown move/);
    expect(() => applyMove(createSolvedCube(), '')).toThrow(/Unknown move/);
  });
});

describe('scramble + inverse returns to solved', () => {
  it('random 20–25 move scrambles invert to the solved cube', () => {
    const rand = mulberry32(20261029);
    for (let i = 0; i < 25; i++) {
      const len = 20 + Math.floor(rand() * 6); // 20..25
      const scramble = randomScramble(rand, len);
      const state = applyMoves(createSolvedCube(), scramble);
      expect(validateCube(state)).toBe(true);
      const inverse = [...scramble].reverse().map(invert);
      expect(applyMoves(state, inverse)).toBe(createSolvedCube());
    }
  });
});

describe('engine ↔ solver cross-check', async () => {
  // Dynamic import: Vitest hangs on statically destructured named imports
  // of `rubik-solver` (a Vite ESM quirk); the app itself is unaffected.
  const RS = await import('rubik-solver');

  it('solutions from rubik-solver solve engine-produced states', () => {
    RS.initSolver(); // one-time ~1.3 s table build
    const Cube = RS.Cube;
    const solveFn = RS.solve;
    const rand = mulberry32(42);
    for (let i = 0; i < 5; i++) {
      const scramble = randomScramble(rand, 20);
      const state = applyMoves(createSolvedCube(), scramble);
      const cube = Cube.fromString(toFacelet(state));
      const seq = solveFn(cube);
      expect(seq).not.toBeNull();
      const moves = seq!.split(' ').filter(Boolean);
      expect(applyMoves(state, moves)).toBe(createSolvedCube());
    }
  }, 30000);
});

describe('serialize / deserialize', () => {
  it('deserialize accepts a valid state and returns it', () => {
    const s = createSolvedCube();
    expect(deserializeCube(s)).toBe(s);
  });

  it('deserialize throws on invalid input', () => {
    expect(() => deserializeCube('W'.repeat(53))).toThrow(/Invalid cube state/);
    expect(() => deserializeCube('Q'.repeat(54))).toThrow(/Invalid cube state/);
  });

  it('serialize is identity', () => {
    const s = createSolvedCube();
    expect(cloneCube(s)).toBe(s);
  });
});
