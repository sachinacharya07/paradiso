import { useState, useMemo } from 'react';
import StickyThought from './StickyThought';
import { playBeep } from '../../utils/sound';

export default function ThoughtSection({ items, admin = false, onEdit, reload }) {
  const [colorFilter, setColorFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = [...items];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) => t.title?.toLowerCase().includes(q) || t.body?.toLowerCase().includes(q)
      );
    }

    if (colorFilter !== 'all') {
      list = list.filter((t, idx) => {
        // Pastel colors cycle: yellow, pink, mint, lavender, blue
        const colors = ['yellow', 'pink', 'mint', 'lavender', 'blue'];
        const chosen = (t.extra && colors.includes(t.extra.toLowerCase()))
          ? t.extra.toLowerCase()
          : colors[idx % colors.length];
        return chosen === colorFilter;
      });
    }

    return list;
  }, [items, search, colorFilter]);

  return (
    <div className="thought-section-wrap">
      {/* Corkboard Banner */}
      <div className="section-header-banner thought-banner">
        <div className="section-banner-title-box">
          <span className="section-banner-icon">☁</span>
          <div>
            <h2 className="section-banner-heading">CORKBOARD & STICKY THOUGHTS</h2>
            <p className="section-banner-sub">Ephemeral notes, shower thoughts, and candid observations pinned to cork.</p>
          </div>
        </div>

        <div className="section-stat-badges">
          <div className="stat-badge">
            <span className="stat-num">{items.length}</span>
            <span className="stat-lbl">PINNED</span>
          </div>
        </div>
      </div>

      {/* Filter and Color Picker Bar */}
      <div className="section-filter-bar">
        <div className="filter-group">
          <span className="filter-label">NOTE TINT:</span>
          <button
            className={`filter-btn ${colorFilter === 'all' ? 'active' : ''}`}
            onClick={() => {
              playBeep();
              setColorFilter('all');
            }}
          >
            ALL ({items.length})
          </button>
          <button
            className={`filter-btn color-yellow ${colorFilter === 'yellow' ? 'active' : ''}`}
            onClick={() => {
              playBeep();
              setColorFilter('yellow');
            }}
          >
            🟡 YELLOW
          </button>
          <button
            className={`filter-btn color-pink ${colorFilter === 'pink' ? 'active' : ''}`}
            onClick={() => {
              playBeep();
              setColorFilter('pink');
            }}
          >
            🌸 PINK
          </button>
          <button
            className={`filter-btn color-mint ${colorFilter === 'mint' ? 'active' : ''}`}
            onClick={() => {
              playBeep();
              setColorFilter('mint');
            }}
          >
            🍃 MINT
          </button>
          <button
            className={`filter-btn color-lavender ${colorFilter === 'lavender' ? 'active' : ''}`}
            onClick={() => {
              playBeep();
              setColorFilter('lavender');
            }}
          >
            🪻 LAVENDER
          </button>
          <button
            className={`filter-btn color-blue ${colorFilter === 'blue' ? 'active' : ''}`}
            onClick={() => {
              playBeep();
              setColorFilter('blue');
            }}
          >
            🌊 SKY
          </button>
        </div>

        <div className="filter-group right-controls">
          <input
            type="search"
            placeholder="Search sticky notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="section-search-input"
          />
        </div>
      </div>

      {/* Masonry corkboard grid */}
      <div className="sticky-thoughts-masonry">
        {filtered.length === 0 ? (
          <p className="empty-state">No sticky notes match this filter.</p>
        ) : (
          filtered.map((r, i) => (
            <StickyThought
              key={r.id}
              r={r}
              admin={admin}
              onEdit={onEdit}
              reload={reload}
              index={i}
            />
          ))
        )}
      </div>
    </div>
  );
}
