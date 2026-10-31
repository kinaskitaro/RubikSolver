import React, { useMemo } from 'react';
import { getFaceGrid } from '../engine/faceGrid';

export interface FaceNetProps {
  state: string; // 54-char color string in URFDLB order (from engine)
  inputMode?: boolean;      // when true, each sticker is clickable to paint it
  onStickerClick?: (index: number) => void; // optional handler for input mode
}

const CELL = 50; // px per sticker within a face block
const PITCH = CELL + 4; // spacing between adjacent stickers/faces

type FaceCoords = { top: number; left: number };

// Where each face's 3x3 block sits in the cross-shaped net wrapper (px).
// Numeric keys 0..5 match FACE_ORDER/faceIndex passed by FaceNet.
// L/F/R/B form the middle band; U sits above F, D below it.
const POSITIONS: Record<number, FaceCoords> = {
  0: { top: 0, left: 3 * PITCH }, // U above F
  1: { top: 3 * PITCH, left: 0 }, // L left of F
  2: { top: 3 * PITCH, left: 3 * PITCH }, // F center (front)
  3: { top: 3 * PITCH, left: 6 * PITCH }, // R right of F
  4: { top: 3 * PITCH, left: 9 * PITCH }, // B far right = the back face
  5: { top: 6 * PITCH, left: 3 * PITCH }, // D below F (down)
};

function FaceBlock({
  faceIndex,
  grid,
  inputMode,
  onStickerClick,
}: {
  faceIndex: number;
  grid: string[][];
  inputMode?: boolean;
  onStickerClick?: (index: number) => void;
}) {
  const coords = POSITIONS[faceIndex];
  return (
    <div className="face-block" style={{ position: 'absolute', top: coords.top, left: coords.left }}>
      <div className="sticker-grid">
        {grid.map((row, r) =>
          row.map((color, c) => (
            <button
              key={`${r}-${c}`}
              type="button"
              className={`net-sticker${inputMode ? ' clickable' : ''}`}
              data-color={color}
              onClick={() => inputMode && onStickerClick?.(faceIndex * 9 + r * 3 + c)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export const FaceNet: React.FC<FaceNetProps> = ({ state, inputMode, onStickerClick }) => {
  const grids = useMemo(() => {
    const out: Record<number, string[][]> = {};
    for (let f = 0; f < 6; f++) out[f] = getFaceGrid(state, f).grid;
    return out;
  }, [state]);

  // Wrapper spans cols 0..11 and rows 0..8.
  const size = { width: 12 * PITCH, height: 9 * PITCH };

  return (
    <div className="face-net" data-state={state} style={{ ...size, width: `${size.width}px`, height: `${size.height}px` }}>
      {Object.entries(grids).map(([f]) => {
        const fi = Number(f);
        const grid = grids[fi];
        return (
          <FaceBlock key={fi} faceIndex={fi} grid={grid} inputMode={inputMode} onStickerClick={onStickerClick} />
        );
      })}
    </div>
  );
};

export default FaceNet;
