import './App.css'
import './components/Cube3D.css'
import { useState, useEffect } from 'react';
import { createSolvedCube, validateCube, applyMove, applyMoves } from './engine/cubeState';
import { solveCube } from './engine/solverAdapter';
import { CubeView } from './components/CubeView';
import { Cube3D } from './components/Cube3D';
import { scramble as generateScramble } from 'rubik-solver';

const PALETTE = [
  { letter: 'W', bg: '#ffffff' },
  { letter: 'Y', bg: '#f2c200' },
  { letter: 'G', bg: '#009e60' },
  { letter: 'B', bg: '#0051ba' },
  { letter: 'R', bg: '#b4001e' },
  { letter: 'O', bg: '#ff5800' },
];

function App() {
  // Hydrate persisted UI state during the initial render via a lazy initializer,
  // so we never call setState inside an effect. localStorage survives reloads.
  const [cube, setCube] = useState(() => {
    const stored = localStorage.getItem('cubeState');
    return stored ?? createSolvedCube();
  });
  const [moves, setMoves] = useState<string[]>(() => {
    const stored = localStorage.getItem('solutionMoves');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [newMove, setNewMove] = useState('');

  // --- Color input mode ----------------------------------------------------
  const [inputMode, setInputMode] = useState(false);
  const [paintColor, setPaintColor] = useState<string | null>('W'); // null = eraser

  useEffect(() => {
    localStorage.setItem('cubeState', cube);
    localStorage.setItem('solutionMoves', JSON.stringify(moves));
  }, [cube, moves]);

  // Exit input mode on Escape key.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && inputMode) setInputMode(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inputMode]);

  async function handleSolve() {
    if (!validateCube(cube)) {
      setError('Invalid cube state: expected 54 characters with exactly 9 of each color (W Y G B R O)');
      setMoves([]);
      return;
    }
    setLoading(true);
    try {
      const seq = await solveCube(cube);
      if (seq.length === 0) {
        setError('Cube is already solved');
        setMoves([]);
      } else {
        setMoves(seq);
        setStepIndex(0);
        setError('');
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyMove() {
    const movesToApply = newMove.trim().split(/\s+/).filter(Boolean);
    if (movesToApply.length === 0) return;
    try {
      const newCube = applyMoves(cube, movesToApply);
      setCube(newCube);
      setError('');
    } catch (err) {
      setError(String(err));
    }
    setNewMove('');
  }

  function handleReset() {
    setCube(createSolvedCube());
    setMoves([]);
    setStepIndex(0);
    setError('');
  }

  function handleScramble() {
    const scrambleStr = generateScramble(22); // random scramble of length 22
    const movesArray = scrambleStr.split(/\s+/).filter(Boolean);
    const newCube = applyMoves(createSolvedCube(), movesArray);
    setCube(newCube);
    setMoves(movesArray);
    setStepIndex(0);
    setError('');
  }

  function handleNextMove() {
    if (stepIndex < moves.length) {
      const newCube = applyMove(cube, moves[stepIndex]);
      setCube(newCube);
      setStepIndex(stepIndex + 1);
    }
  }

  // --- Color input mode ----------------------------------------------------
  function handlePaintSticker(faceIndex: number, cellIndex: number) {
    if (!inputMode) return;
    const pos = faceIndex * 9 + cellIndex;
    const candidate = [...cube];
    if (paintColor === null) {
      // Eraser — drop this sticker only if the color count stays valid.
      candidate[pos] = '';
    } else {
      candidate[pos] = paintColor;
    }
    const next = candidate.join('');
    if (!validateCube(next)) return; // e.g. erased the last of a color
    setCube(next);
    setError('');
  }

  function toggleInputMode() {
    setInputMode(prev => !prev);
  }

  function selectPalette(letter: string) {
    setPaintColor(letter);
  }

  return (
    <div style={{ padding: 20, maxWidth: 960, margin: '0 auto' }}>
      <h1>Rubik’s Cube Solver</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
        {/* Left column — the cube */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className={`cube-stage cube${loading || inputMode ? ' paused' : ''}`} style={{ '--cube-size': '104px' } as React.CSSProperties}>
            <Cube3D state={cube} inputMode={inputMode} onStickerClick={handlePaintSticker} />
          </div>

          {/* Color input controls */}
          <div className="color-input">
            <button onClick={toggleInputMode} style={{ marginBottom: 10 }}>
              {inputMode ? 'Exit Input Mode (Esc)' : '🎨 Paint Colors'}
            </button>
            <p style={{ margin: '4px 0', fontSize: 13, opacity: inputMode ? 1 : 0.6 }}>
              {inputMode
                ? 'Click any sticker to paint it with the selected color.'
                : 'Click “Paint Colors” then click stickers on the cube to build a scramble by hand.'}
            </p>
            <div className="palette">
              {PALETTE.map(p => (
                <button
                  key={p.letter}
                  type="button"
                  className={`swatch${inputMode && paintColor === p.letter ? ' active' : ''}`}
                  style={{ background: p.bg }}
                  onClick={() => selectPalette(p.letter)}
                  aria-label={`Paint ${p.letter}`}
                />
              ))}
              {inputMode && (
                <button
                  type="button"
                  className="swatch eraser"
                  onClick={() => setPaintColor(null)}
                  aria-label="Eraser"
                />
              )}
            </div>
          </div>
        </div>

        {/* Right column — controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea
            value={cube}
            onChange={e => setCube(e.target.value)}
            rows={6}
            placeholder="54-char cube state (URFDLB order)"
            style={{ fontFamily: 'monospace', resize: 'vertical' }}
          />

          <div className="move-row">
            <input
              type="text"
              aria-label="Apply moves"
              value={newMove}
              onChange={e => setNewMove(e.target.value)}
              placeholder="Enter move(s) e.g. R U'"
            />
            <button onClick={handleApplyMove} disabled={loading || newMove.trim() === ''}>Apply Move</button>
          </div>

          <div className="btn-row">
            <button onClick={handleScramble} disabled={loading}>Scramble</button>
            <button onClick={handleReset} disabled={loading}>Reset</button>
            <button onClick={handleSolve} disabled={loading}>Solve</button>
          </div>

          {loading && <p style={{ fontStyle: 'italic', opacity: 0.8 }}>Solving…</p>}
          {error && <pre style={{ color: '#ff6b6b', whiteSpace: 'pre-wrap' }}>{error}</pre>}

          {moves.length > 0 && (
            <>
              <h2>Solution ({moves.length})</h2>
              <code>{moves.join(' ')}</code>
              {stepIndex < moves.length && (
                <div style={{ marginTop: 10 }}>
                  <span>Move {stepIndex + 1} of {moves.length}</span>
                  <button onClick={handleNextMove} disabled={loading}>Next Move</button>
                </div>
              )}
            </>
          )}

          {/* Legacy net view (kept for reference / accessibility) */}
          <h3 style={{ marginTop: 8 }}>Face Net</h3>
          <CubeView state={cube} />
        </div>
      </div>
    </div>
  );
}

export default App;
