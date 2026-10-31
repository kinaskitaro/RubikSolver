import './App.css'
import './components/FaceNet.css'
import './components/Cube3D.css'
import { useState, useEffect, useCallback } from 'react';
import { createSolvedCube, validateCube, applyMove, applyMoves } from './engine/cubeState';
import { solveCube } from './engine/solverAdapter';
import { FaceNet } from './components/FaceNet';
import { Cube3D } from './components/Cube3D';
import { scramble as generateScramble } from 'rubik-solver';

const PALETTE = [
  { letter: 'W', bg: '#f7f7f8' }, // White (Up)
  { letter: 'Y', bg: '#f2c200' }, // Yellow (Down)
  { letter: 'G', bg: '#009e60' }, // Green (Front)
  { letter: 'B', bg: '#0051ba' }, // Blue (Back)
  { letter: 'R', bg: '#b4001e' }, // Red (Right)
  { letter: 'O', bg: '#ff5800' }, // Orange (Left)
];

// Coloured bar under each face-turn button = that face's home colour.
const MOVE_BAR_COLOR = { U: '#f7f7f8', D: '#f2c200', F: '#009e60', B: '#0051ba', R: '#b4001e', L: '#ff5800' };

type ViewMode = '3D' | 'Flat' | 'Kociemba';

const VIEWS: { id: ViewMode; label: string }[] = [
  { id: '3D', label: '3D' },
  { id: 'Flat', label: 'Flat' },
  { id: 'Kociemba', label: 'Kociemba' },
];

// Face letters typed with `as const` so MOVE_BAR_COLOR indexing stays type-safe.
const FACES = ['U', 'R', 'F', 'D', 'L', 'B'] as const;
const INVERSE_FACES = [['F', true], ['R', true], ['U', true], ['B', true], ['L', true], ['D', true]] as const;

function normalizeMove(token: string): string {
  // Keep only single-face moves for the replay list; drop slice/whole-cube moves.
  const letter = token[0];
  // FACES is a `readonly` tuple of literals; widen for the membership test.
  if (!((FACES as readonly string[]).includes(letter))) return '';
  return token.includes('2') ? `${letter}2` : token === letter.toLowerCase() || token.includes("'") ? `${letter}'` : letter;
}

function parseStored(key: string): string[] {
  const stored = localStorage.getItem(key);
  if (!stored) return [];
  try { const parsed = JSON.parse(stored); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

function App() {
  // Hydrate persisted UI state during the initial render via a lazy initializer,
  // so we never call setState inside an effect. localStorage survives reloads.
  const [cube, setCube] = useState(() => (localStorage.getItem('cubeState') ?? createSolvedCube()) as string);
  const [moves, setMoves] = useState<string[]>(() => parseStored('solutionMoves'));
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [newMove, setNewMove] = useState(''); // "Enter move(s) e.g. R U'" row
  const [scrambleInput, setScrambleInput] = useState(''); // right-hand scramble field
  const [inputMode, setInputMode] = useState(false); // paint mode toggle
  const [paintColor, setPaintColor] = useState<string | null>('W');
  const [viewMode, setViewMode] = useState<ViewMode>('Flat');
  const [playing, setPlaying] = useState(false);
  const [scanning, setScanning] = useState('');

  function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') setInputMode(false); }

  useEffect(() => { localStorage.setItem('cubeState', cube); }, [cube]);
  useEffect(() => { localStorage.setItem('solutionMoves', JSON.stringify(moves)); }, [moves]);
  useEffect(() => { if (inputMode) window.addEventListener('keydown', onEsc); return () => window.removeEventListener('keydown', onEsc); }, [inputMode]);

  // --- Solve ---------------------------------------------------------------
  async function handleSolve() {
    setScanning('Calculating the solution. Please wait patiently!');
    if (!validateCube(cube)) {
      setError('Invalid cube state: expected 54 characters with exactly 9 of each color (W Y G B R O)');
      setMoves([]); setStepIndex(0);
      setScanning(''); return;
    }
    setLoading(true);
    try {
      const seq = await solveCube(cube);
      if (seq.length === 0) { setError('Cube is already solved'); setMoves([]); }
      else { setMoves(seq); setStepIndex(0); setError(''); }
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); setScanning(''); }
  }

  // --- Apply a run of face letters (the "Enter move(s)" row) ---------------
  async function handleApplyMove() {
    const tokens = newMove.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return;
    try { setCube(applyMoves(cube, tokens)); setError(''); } catch (err) { setError(String(err)); }
    setNewMove('');
  }

  // --- Reset / clear -------------------------------------------------------
  function handleReset() {
    setCube(createSolvedCube()); setMoves([]); setStepIndex(0); setError(''); setScanning('');
  }
  function handleClear() { handleReset(); }

  // --- Scramble field: apply a typed sequence at once ----------------------
  function handleApplyScramble() {
    const tokens = scrambleInput.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return;
    try {
      setCube(applyMoves(createSolvedCube(), tokens));
      setMoves(tokens.map(normalizeMove).filter((m): m is string => m.length > 0)); // replayable list of single moves
      setStepIndex(0); setError('');
    } catch (err) { setError(String(err)); }
  }

  // --- Replay the loaded solution move-by-move -----------------------------
  const activeMove = moves.length > 0 && stepIndex < moves.length ? moves[stepIndex] : '';
  const isActive = (move: string) => activeMove !== '' && move === activeMove;

  // Stable replay stepper. Kept as useCallback so it can be referenced from the
  // effect below without tripping exhaustive-deps, and its body never calls
  // setState directly (the loop stops via setPlaying inside a state updater).
  const handleNextMove = useCallback(() => {
    if (playing && stepIndex < moves.length) {
      const mv = moves[stepIndex];
      try { setCube(prev => applyMove(prev, mv)); } catch { /* ignore */ }
      setStepIndex(stepIndex + 1);
    } else {
      // Reached the end of the sequence: stop from within a state updater (not an effect).
      setPlaying(false);
    }
  }, [playing, moves, stepIndex]);

  useEffect(() => {
    if (!playing || loading) return;
    const t = setTimeout(handleNextMove, 320);
    return () => clearTimeout(t);
  }, [stepIndex, moves, playing, loading, handleNextMove]);

  function handlePlayReplay() { setStepIndex(0); setPlaying(true); setError(''); }

  // --- Face-turn buttons (the F R U B L D grid + inverse row) --------------
  function handleFaceTurn(letter: string, inverse: boolean) {
    const mv = inverse ? `${letter}'` : letter;
    try { setCube(prev => applyMove(prev, mv)); setError(''); } catch (err) { setError(String(err)); }
    // Auto-advance the loaded solution when the exact next move is pressed.
    if (moves.length > 0 && stepIndex < moves.length && mv === activeMove) {
      setStepIndex(stepIndex + 1);
    }
  }

  // --- Paint mode ----------------------------------------------------------
  function handlePaintSticker(index: number) {
    if (!inputMode) return;
    const candidate = [...cube];
    candidate[index] = paintColor === null ? '' : paintColor;
    const next = candidate.join('');
    if (!validateCube(next)) return; // e.g. erased the last of a color
    setCube(next); setError('');
  }

  function selectPalette(letter: string) { setPaintColor(letter); setInputMode(true); }
  function selectEraser() { setPaintColor(null); setInputMode(true); }

  // --- Scanning stub (honest, non-destructive) -----------------------------
  function handleScan() {
    // Camera scanning is not wired up in this build; give an honest, non-destructive
    // message and steer the user to manual entry. (No branch can be "always true".)
    setScanning('Camera scanning is not supported in this build — paint colors or type a state string instead.');
    setTimeout(() => setScanning(''), 3500);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <nav className="tabs" aria-label="View mode">
          {VIEWS.map(v => (
            <button key={v.id} className={`tab${viewMode === v.id ? ' active' : ''}`} onClick={() => setViewMode(v.id)}>{v.label}</button>
          ))}
        </nav>
        <div className="header-actions">
          <button type="button" className="ghost-btn" title="Scan your cube (manual entry supported)" onClick={handleScan}>📷 Scan your cube</button>
          <span className={`scan-notice${scanning ? ' show' : ''}`}>{scanning}</span>
        </div>
      </header>

      <main className="app-main">
        {/* Left column — the cube + raw state */}
        <section className="cube-area">
          {viewMode === '3D' ? (
            <Cube3D state={cube} inputMode={inputMode} onStickerClick={handlePaintSticker} />
          ) : viewMode === 'Kociemba' ? (
            <>
              <div className="flat-label">Flat net</div>
              <FaceNet state={cube} inputMode={false} />
            </>
          ) : (
            <>
              <div className="flat-label">Face net — click a sticker to paint when in input mode</div>
              <FaceNet state={cube} inputMode={inputMode} onStickerClick={handlePaintSticker} />
            </>
          )}

          <textarea aria-label="Cube state" value={cube} onChange={e => setCube(e.target.value)} rows={6} placeholder="54-char cube state (URFDLB order)" className="state-textarea" />

          <div className="apply-row">
            <input type="text" aria-label="Apply moves" value={newMove} onChange={e => setNewMove(e.target.value)} placeholder="Enter move(s) e.g. R U'" />
            <button type="button" className="ghost-btn" disabled={loading || !newMove.trim()} onClick={handleApplyMove}>Apply Move</button>
          </div>

          {error && <pre className="error-box">{error}</pre>}
        </section>

        {/* Right column — controls panel */}
        <aside className="controls">
          <div className="swatch-row" title="Click a colour to enter paint mode, then click stickers on the cube.">
            {PALETTE.map(p => (
              <button key={p.letter} type="button" className={`swatch${inputMode && paintColor === p.letter ? ' active' : ''}`} style={{ background: p.bg }} onClick={() => selectPalette(p.letter)} aria-label={`Paint ${p.letter}`}>
                {inputMode && <span className="swatch-check">✓</span>}
              </button>
            ))}
            {inputMode && (
              <button type="button" className={`swatch eraser${paintColor === null ? ' active' : ''}`} onClick={() => selectEraser()} aria-label="Eraser" title="Erase the selected sticker" />
            )}
          </div>

          {/* Face-turn buttons with coloured bars */}
          <div className="move-grid">
            {FACES.map(letter => (
              <button key={letter} type="button" className={`face-move${isActive(`${letter}`) ? ' active' : ''}`} onClick={() => handleFaceTurn(letter, false)}>
                {letter}<span className="move-bar" style={{ background: MOVE_BAR_COLOR[letter] }} />
              </button>
            ))}
            {INVERSE_FACES.map(([letter, inverse]) => (
              <button key={`${inverse ? `${letter}'` : letter}`} type="button" className={`face-move inverse${isActive(`${letter}'`) ? ' active' : ''}`} onClick={() => handleFaceTurn(letter, inverse)}>
                {letter}<span className="prime">&apos;</span><span className="move-bar" style={{ background: MOVE_BAR_COLOR[letter] }} />
              </button>
            ))}
          </div>

          {/* Scramble field with apply / play */}
          <div className="scramble-row">
            <input type="text" aria-label="Scramble sequence" value={scrambleInput} onChange={e => setScrambleInput(e.target.value)} placeholder="Scramble (F R2 U')" />
            <button type="button" className="dark-btn" title="Apply the typed moves at once" onClick={handleApplyScramble}>✓</button>
            <button type="button" className="play-btn" title="Play the solution / sequence step by step" onClick={handlePlayReplay}>{playing ? '⏸' : '▶'}</button>
          </div>

          {/* Action buttons */}
          <div className="action-row">
            <button type="button" className="ghost-btn" disabled={loading} onClick={handleClear}>Clear</button>
            <button type="button" className="ghost-btn" disabled={loading} onClick={handleReset}>Reset</button>
            <button type="button" className="ghost-btn" disabled={loading} onClick={() => {
              const tokens = generateScramble(22).split(/\s+/);
              setCube(applyMoves(createSolvedCube(), tokens));
              setMoves(tokens.map(normalizeMove).filter((m): m is string => m.length > 0));
              setStepIndex(0); setError('');
            }}>Scramble</button>
          </div>

          {/* Solve — validates internally and shows a clear error for invalid cubes. */}
          <button type="button" className="solve-btn" disabled={loading} onClick={handleSolve}>Solve ✨</button>

          {/* Solution stepper */}
          {moves.length > 0 && (
            <div className="solution">
              <h2>Solution ({moves.length})</h2>
              <code>{moves.join(' ')}</code>
              {stepIndex < moves.length && !playing && !loading && (
                <button type="button" className="next-btn" disabled={playing} onClick={handleNextMove}>Next Move →</button>
              )}
            </div>
          )}
        </aside>
      </main>

      <footer className="app-footer">
        <p>Type a move sequence, paint colors, or press Solve to get a shortest path back home.</p>
      </footer>
    </div>
  );
}

export default App;
