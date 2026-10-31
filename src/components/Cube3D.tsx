import React, { useState, useRef } from 'react';
import { slotFor } from '../engine/faceGrid';

interface Props {
  state: string; // 54-char color string in URFDLB order (from engine)
  inputMode?: boolean;      // when true, each sticker is clickable to paint it
  onStickerClick?: (faceIndex: number, cellIndex: number) => void; // optional handler for input mode
  paused?: boolean;         // when true, the idle spin animation stops
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

const COLOR_MAP: Record<string, string> = {
  W: '',   // transparent -> uses the CSS vignette via [data-color="W"]
  Y: '#f2c200',
  G: '#009e60',
  B: '#0051ba',
  R: '#b4001e',
  O: '#ff5800',
};

interface Rotation {
  x: number; // pitch (deg)
  y: number; // yaw (deg)
}

export const Cube3D: React.FC<Props> = ({ state, inputMode, onStickerClick, paused }) => {
  const [rotation, setRotation] = useState<Rotation>({ x: -18, y: -32 });
  const dragRef = useRef<{ startX: number; startY: number; lastX: number; lastY: number } | null>(null);

  const paintOnClick = (faceIndex: number, cellIndex: number): void => {
    if (inputMode && onStickerClick) onStickerClick(faceIndex, cellIndex);
  };

  // Drag-to-rotate. Only active when NOT painting (painting needs precise clicks).
  const onPointerDown = (e: React.PointerEvent): void => {
    if (inputMode) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, lastX: rotation.y, lastY: rotation.x };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent): void => {
    const d = dragRef.current;
    if (!d) return;
    setRotation({ x: d.lastY - (e.clientX - d.startX) * 0.4, y: d.lastX + (e.clientY - d.startY) * 0.4 });
  };

  const onPointerUp = (): void => {
    dragRef.current = null;
  };

  // Keyboard nudge for accessibility.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (inputMode || !dragRef.current) return;
      setRotation(prev => {
        const pitchStep = e.key === 'ArrowUp' ? -5 : e.key === 'ArrowDown' ? 5 : 0;
        const yawStep = e.key === 'ArrowLeft' ? -5 : e.key === 'ArrowRight' ? 5 : 0;
        return { x: prev.x + pitchStep, y: prev.y + yawStep };
      });
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inputMode]);

  const slice = (faceIndex: number) => state.slice(faceIndex * 9, faceIndex * 9 + 9).split('');

  return (
    <div
      className={`cube-stage cube${paused ? ' paused' : ''}`}
      style={{ '--cube-size': '104px' } as React.CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div className="cube-inner" style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}>
        {Array.from({ length: 6 }, (_, faceIndex) => (
          <div key={faceIndex} className="face" style={{ transform: faceTransform(faceIndex) }}>
            <div className="stickers">
              {slice(faceIndex).map((color, idx) => {
                const [row, col] = slotFor(faceIndex, idx);
                return (
                  <button
                    type="button"
                    key={idx}
                    className={`sticker${inputMode ? ' clickable' : ''}`}
                    data-color={color}
                    style={{ gridRow: row + 1, gridColumn: col + 1, background: COLOR_MAP[color] || undefined }}
                    onClick={() => paintOnClick(faceIndex, idx)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Cube3D;
