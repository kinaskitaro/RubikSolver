import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import App from '../App';
import { createSolvedCube, validateCube, applyMoves } from '../engine/cubeState';
import { solveCube } from '../engine/solverAdapter';

// A small non-identity scramble as individual moves (URFDLB notation).
const SCRAMBLE_MOVES = "R U R' U'".split(/\s+/);

describe('Engine utilities', () => {
  it('validateCube accepts good state and rejects bad ones', () => {
    expect(validateCube(createSolvedCube())).toBe(true);
    const short = createSolvedCube().slice(0, 53);
    expect(validateCube(short)).toBe(false); // wrong length
    const badColors = 'X'.repeat(54);
    expect(validateCube(badColors)).toBe(false); // invalid chars
  });
});

describe('solveCube', () => {
  it('solves solved cube to empty array', async () => {
    const seq = await solveCube(createSolvedCube());
    expect(seq).toEqual([]);
  });

  it('returns a non-empty solution for a scrambled state', async () => {
    // Build the actual 54-char STATE (not a move list) from moves.
    const scrambledState = applyMoves(createSolvedCube(), SCRAMBLE_MOVES);
    expect(validateCube(scrambledState)).toBe(true);
    const seq = await solveCube(scrambledState);
    expect(seq.length).toBeGreaterThan(0);
  });
});

describe('App component', () => {
  // Every test renders into its own detached container and queries only within
  // that container, so instances never leak across tests (no shared `screen`).
  afterEach(cleanup);

  async function setup(): Promise<HTMLDivElement> {
    const div = document.createElement('div');
    document.body.appendChild(div);
    render(<App />, { container: div });
    return div;
  }

  it('shows error for invalid input', async () => {
    const div = await setup();
    fireEvent.change(div.querySelector('textarea')!, { target: { value: 'W'.repeat(53) } });
    div.querySelector('.solve-btn').click();
    await waitFor(() => expect(div.querySelector('pre')).toBeTruthy());
  });

  it('shows solved message for a solved cube', async () => {
    const div = await setup();
    fireEvent.change(div.querySelector('textarea')!, { target: { value: createSolvedCube() } });
    div.querySelector('.solve-btn').click();
    await waitFor(() => expect(div.querySelector('pre')).toBeTruthy()); // "already solved"
  });

  it('shows a solution for a scrambled state', async () => {
    const div = await setup();
    const state = applyMoves(createSolvedCube(), SCRAMBLE_MOVES);
    fireEvent.change(div.querySelector('textarea')!, { target: { value: state } });
    div.querySelector('.solve-btn').click();
    await waitFor(() => {
      expect(div.querySelector('h2')).toBeTruthy(); // "Solution (n)" heading appears once moves exist
      const code = div.querySelector('code');
      expect(code?.textContent?.length ?? 0).toBeGreaterThan(0);
    });
  });
});
