
interface Props {
  state: string; // 54-char color string in URFDLB order (from engine)
  inputMode?: boolean;      // when true, each sticker is clickable to paint it
  onStickerClick?: (faceIndex: number, cellIndex: number) => void; // optional handler for input mode
}

const STICKER = 28; // px visible size of one sticker
const FACE_SIZE = 3 * (STICKER + 4); // 90px net per face
const HALF = FACE_SIZE / 2 - 1; // translate distance to push each face onto the cube surface

// Face transforms: rotate about the cube center, then translate along the outward normal.
function faceTransform(faceIndex: number): string {
  switch (faceIndex) {
    case 0: return `translateZ(${HALF}px)`;                   // Front (+z)
    case 1: return `rotateY(180deg) translateZ(${HALF}px)`;   // Back (-z)
    case 2: return `rotateY(-90deg) translateZ(${HALF}px)`;   // Right (+x)
    case 3: return `rotateX(90deg) translateZ(${HALF}px)`;    // Down (-y)
    case 4: return `rotateY(90deg) translateZ(${HALF}px)`;    // Left (-x)
    case 5: return `rotateX(-90deg) translateZ(${HALF}px)`;   // Up (+y)
    default: return 'translateZ(0px)';
  }
}

// Orientation of the state slice for a face into the visual 3x3 grid.
// A fixed mapping keeps rendering coherent across rotations (the solver only
// permutes which color lands in each cell), so this never needs to change.
function slotFor(faceIndex: number, idx: number): [number, number] {
  const r = Math.floor(idx / 3);
  const c = idx % 3;
  // Back face is viewed from behind -> flip both axes so it reads naturally.
  if (faceIndex === 1) return [2 - r, 2 - c];
  return [r, c];
}

const COLOR_MAP: Record<string, string> = {
  W: '',   // transparent -> uses the CSS vignette via [data-color="W"]
  Y: '#f2c200',
  G: '#009e60',
  B: '#0051ba',
  R: '#b4001e',
  O: '#ff5800',
};

export const Cube3D: React.FC<Props> = ({ state, inputMode, onStickerClick }) => {
  const cells = Array.from({ length: 6 }, (_, faceIndex) => {
    const start = faceIndex * 9;
    const slice = state.slice(start, start + 9).split('');
    return { faceIndex, slice };
  });

  const paintOnClick = (faceIndex: number, cellIndex: number): void => {
    if (inputMode && onStickerClick) onStickerClick(faceIndex, cellIndex);
  };

  return (
    <div className="cube" style={{ ['--half' as string]: `${HALF}px` }}>
      {cells.map(({ faceIndex, slice }) => (
        <div key={faceIndex} className="face" style={{ transform: faceTransform(faceIndex) }}>
          <div className="stickers">
            {slice.map((color, idx) => {
              const [row, col] = slotFor(faceIndex, idx);
              return (
                <button
                  type="button"
                  key={idx}
                  className={`sticker${inputMode ? ' clickable' : ''}`}
                  data-color={color}
                  style={{ gridRow: row + 1, gridColumn: col + 1, background: COLOR_MAP[color] || undefined }}
                  onClick={() => paintOnClick(faceIndex, idx)}
                >
                  {inputMode && <span className="sticker-shine" />}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Cube3D;
