import { useState, useMemo } from 'react';
import PoemNote from './PoemNote';
import { playTypewriterClick, playBeep } from '../../utils/sound';

export default function PoemSection({ items, admin = false, onEdit, reload }) {
  const [globalFont, setGlobalFont] = useState('typewriter'); // 'typewriter', 'serif'
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const filteredAndSorted = useMemo(() => {
    let list = [...items];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.body?.toLowerCase().includes(q) ||
          p.extra?.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'title') {
      list.sort((a, b) => (a.title || 'Untitled').localeCompare(b.title || 'Untitled'));
    } else {
      list.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
    }

    return list;
  }, [items, search, sortBy]);

  return (
    <div className={`poem-section-wrap font-${globalFont}`}>
      {/* Typewriter Banner */}
      <div className="section-header-banner poem-banner">
        <div className="section-banner-title-box">
          <span className="section-banner-icon">❀</span>
          <div>
            <h2 className="section-banner-heading">TYPEWRITER ANTHOLOGY</h2>
            <p className="section-banner-sub">Verses, stanzas, and quiet prose on lined parchment paper.</p>
          </div>
        </div>

        <div className="section-stat-badges">
          <div className="stat-badge">
            <span className="stat-num">{items.length}</span>
            <span className="stat-lbl">POEMS</span>
          </div>

          {/* Global Font Switcher */}
          <div className="poem-global-font-picker">
            <button
              type="button"
              className={`font-toggle-pill ${globalFont === 'typewriter' ? 'active' : ''}`}
              onClick={() => {
                playTypewriterClick();
                setGlobalFont('typewriter');
              }}
              title="Switch to vintage monospace typewriter"
            >
              Aa Typewriter
            </button>
            <button
              type="button"
              className={`font-toggle-pill ${globalFont === 'serif' ? 'active' : ''}`}
              onClick={() => {
                playTypewriterClick();
                setGlobalFont('serif');
              }}
              title="Switch to classic literary serif"
            >
              Aa Serif
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="section-filter-bar">
        <div className="filter-group">
          <span className="filter-label">ANTHOLOGY:</span>
          <span className="badge-pill">{filteredAndSorted.length} WORKS</span>
        </div>

        <div className="filter-group right-controls">
          <input
            type="search"
            placeholder="Search stanzas or titles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="section-search-input"
          />

          <select
            className="section-sort-select"
            value={sortBy}
            onChange={(e) => {
              playBeep();
              setSortBy(e.target.value);
            }}
          >
            <option value="newest">Latest Composed</option>
            <option value="title">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Poems Notebook Feed */}
      <div className="poems-notebook">
        {filteredAndSorted.length === 0 ? (
          <p className="empty-state">No poems match your search.</p>
        ) : (
          filteredAndSorted.map((r, i) => (
            <PoemNote
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
