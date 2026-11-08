import { useState, useMemo } from 'react';
import GameCartridge, { parseGameMeta } from './GameCartridge';
import { playBeep } from '../../utils/sound';

export default function GameSection({ items, admin = false, onEdit, reload }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'score', 'platform', 'title'
  const [search, setSearch] = useState('');

  // Stats
  const stats = useMemo(() => {
    let beaten = 0;
    let playing = 0;
    items.forEach((item) => {
      const meta = parseGameMeta(item.extra);
      if (/beaten|completed/i.test(meta.status)) beaten++;
      if (/playing/i.test(meta.status)) playing++;
    });
    return { total: items.length, beaten, playing };
  }, [items]);

  const filteredAndSorted = useMemo(() => {
    let list = [...items];

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((g) => {
        const meta = parseGameMeta(g.extra);
        return (
          g.title?.toLowerCase().includes(q) ||
          meta.platform.toLowerCase().includes(q) ||
          g.body?.toLowerCase().includes(q)
        );
      });
    }

    // Status filter
    if (statusFilter === 'beaten') {
      list = list.filter((g) => /beaten|completed/i.test(parseGameMeta(g.extra).status));
    } else if (statusFilter === 'playing') {
      list = list.filter((g) => /playing/i.test(parseGameMeta(g.extra).status));
    } else if (statusFilter === 'backlog') {
      list = list.filter((g) => /backlog|wishlist/i.test(parseGameMeta(g.extra).status));
    }

    // Sort
    if (sortBy === 'score') {
      list.sort((a, b) => {
        const aScore = parseFloat(parseGameMeta(a.extra).score) || 0;
        const bScore = parseFloat(parseGameMeta(b.extra).score) || 0;
        return bScore - aScore;
      });
    } else if (sortBy === 'platform') {
      list.sort((a, b) => parseGameMeta(a.extra).platform.localeCompare(parseGameMeta(b.extra).platform));
    } else if (sortBy === 'title') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else {
      list.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
    }

    return list;
  }, [items, search, statusFilter, sortBy]);

  return (
    <div className="game-section-wrap">
      {/* Arcade Banner */}
      <div className="section-header-banner game-banner">
        <div className="section-banner-title-box">
          <span className="section-banner-icon">🎮</span>
          <div>
            <h2 className="section-banner-heading">ARCADE & CARTRIDGE RACK</h2>
            <p className="section-banner-sub">Retro playthroughs, cartridges beaten, and 16-bit memories.</p>
          </div>
        </div>

        <div className="section-stat-badges">
          <div className="stat-badge">
            <span className="stat-num">{stats.total}</span>
            <span className="stat-lbl">CARTRIDGES</span>
          </div>
          <div className="stat-badge">
            <span className="stat-num">{stats.beaten}</span>
            <span className="stat-lbl">BEATEN</span>
          </div>
          <div className="stat-badge">
            <span className="stat-num">{stats.playing}</span>
            <span className="stat-lbl">PLAYING</span>
          </div>
        </div>
      </div>

      {/* Filter and Sorting Toolbar */}
      <div className="section-filter-bar">
        <div className="filter-group">
          <span className="filter-label">STATUS:</span>
          <button
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => {
              playBeep();
              setStatusFilter('all');
            }}
          >
            ALL ({items.length})
          </button>
          <button
            className={`filter-btn ${statusFilter === 'beaten' ? 'active' : ''}`}
            onClick={() => {
              playBeep();
              setStatusFilter('beaten');
            }}
          >
            ★ BEATEN ({stats.beaten})
          </button>
          <button
            className={`filter-btn ${statusFilter === 'playing' ? 'active' : ''}`}
            onClick={() => {
              playBeep();
              setStatusFilter('playing');
            }}
          >
            🕹 PLAYING ({stats.playing})
          </button>
          <button
            className={`filter-btn ${statusFilter === 'backlog' ? 'active' : ''}`}
            onClick={() => {
              playBeep();
              setStatusFilter('backlog');
            }}
          >
            ⏳ BACKLOG
          </button>
        </div>

        <div className="filter-group right-controls">
          <input
            type="search"
            placeholder="Search game or platform..."
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
            <option value="newest">Latest Added</option>
            <option value="score">Highest Score ★</option>
            <option value="platform">Platform (A-Z)</option>
            <option value="title">Game Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Cartridge Grid */}
      <div className="game-cartridges-container">
        {filteredAndSorted.length === 0 ? (
          <p className="empty-state">No cartridges match this filter.</p>
        ) : (
          filteredAndSorted.map((r, i) => (
            <GameCartridge
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
