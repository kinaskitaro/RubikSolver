// src/engine/solverAdapter.ts
import kociemba from 'kociemba';

/**
 * Solve a cube state string using the Kociemba two‑phase algorithm.
 * @param state 54‑char cube representation (U,R,F,D,L,B order)
 */
export async function solveCube(state: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    try {
      const seq = kociemba.solve(state); // e.g. "R U R' U'"
      resolve(seq.split(' ').filter(Boolean));
    } catch (e) {
      reject(e);
    }
  });
}
