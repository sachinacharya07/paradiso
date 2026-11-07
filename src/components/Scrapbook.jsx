import { useState, useRef, useEffect } from 'react';

const STORAGE_KEY = 'paradiso-scrap-positions';

/**
 * Load persisted scrapbook positions from localStorage.
 */
function loadPositions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return {};
}

/**
 * Save scrapbook positions to localStorage.
 */
function savePositions(pos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  } catch {
    // ignore
  }
}

/**
 * Scrapbook component — draggable polaroid-style image layout.
 * Positions are persisted in localStorage.
 */
export default function Scrapbook({ items }) {
  const [pos, setPos] = useState(() => loadPositions());
  const dragging = useRef(null);
  const box = useRef(null);

  // Persist positions whenever they change
  useEffect(() => {
    savePositions(pos);
  }, [pos]);

  const getPos = (item, i) =>
    pos[item.id] || { x: (i * 37) % 65, y: (i * 29) % 55 };

  const handleMove = (e) => {
    if (!dragging.current || !box.current) return;
    const b = box.current.getBoundingClientRect();
    const newX = Math.min(75, Math.max(0, ((e.clientX - b.left) / b.width) * 100 - 12));
    const newY = Math.min(80, Math.max(0, ((e.clientY - b.top) / b.height) * 100 - 10));
    setPos(prev => ({
      ...prev,
      [dragging.current]: { x: newX, y: newY },
    }));
  };

  const handleUp = () => {
    dragging.current = null;
  };

  const handleDown = (e, id) => {
    e.target.setPointerCapture(e.pointerId);
    dragging.current = id;
  };

  if (!items.length) {
    return (
      <div className="scrap">
        <p style={{ textAlign: 'center', paddingTop: '30%' }}>no pictures yet.</p>
      </div>
    );
  }

  return (
    <div
      ref={box}
      className="scrap"
      onPointerMove={handleMove}
      onPointerUp={handleUp}
    >
      {items.map((item, i) => {
        const q = getPos(item, i);
        return (
          <img
            key={item.id}
            src={item.image}
            alt={item.title || ''}
            draggable={false}
            style={{
              left: q.x + '%',
              top: q.y + '%',
              transform: `rotate(${((i * 7) % 11) - 5}deg)`,
            }}
            onPointerDown={(e) => handleDown(e, item.id)}
          />
        );
      })}
    </div>
  );
}
