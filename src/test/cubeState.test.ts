import { describe, it, expect } from 'vitest';
import { createSolvedCube, isSolved, cloneCube } from '../engine/cubeState';

describe('cube state', () => {
  it('creates solved cube and reports solved', () => {
    const s = createSolvedCube();
    expect(isSolved(s)).toBe(true);
  });

  it('cloning returns same string', () => {
    const s1 = createSolvedCube();
    const s2 = cloneCube(s1);
    expect(s2).toBe(s1); // strings are immutable, so reference equality is fine
  });
});