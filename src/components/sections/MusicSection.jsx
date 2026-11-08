import { useState, useMemo } from 'react';
import MusicRecord, { parseMusicMeta } from './MusicRecord';
import { playCassetteClick, playBeep } from '../../utils/sound';

export default function MusicSection({ items, admin = false, onEdit, reload }) {
  const [genreFilter, setGenreFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'artist', 'year', 'title'
  const [search, setSearch] = useState('');

  // Extract distinct genres
  const genres = useMemo(() => {
    const set = new Set();
    items.forEach((item) => {
      const { genre } = parseMusicMeta(item.extra);
      if (genre && genre !== 'Eclectic' && genre !== 'Soundtrack') {
        set.add(genre);
      }
    });
    return Array.from(set).slice(0, 5);
  }, [items]);

  const filteredAndSorted = useMemo(() => {
    let list = [...items];

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m) => {
        const meta = parseMusicMeta(m.extra);
        return (
          m.title?.toLowerCase().includes(q) ||
          meta.artist.toLowerCase().includes(q) ||
          meta.genre.toLowerCase().includes(q) ||
          meta.favTrack?.toLowerCase().includes(q) ||
          m.body?.toLowerCase().includes(q)
        );
      });
    }

    // Genre filter
    if (genreFilter !== 'all') {
      list = list.filter((m) => {
        const { genre } = parseMusicMeta(m.extra);
        return genre.toLowerCase() === genreFilter.toLowerCase();
      });
    }

    // Sort
    if (sortBy === 'artist') {
      list.sort((a, b) => parseMusicMeta(a.extra).artist.localeCompare(parseMusicMeta(b.extra).artist));
    } else if (sortBy === 'year') {
      list.sort((a, b) => (parseInt(parseMusicMeta(b.extra).year, 10) || 0) - (parseInt(parseMusicMeta(a.extra).year, 10) || 0));
    } else if (sortBy === 'title') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else {
      list.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
    }

    return list;
  }, [items, search, genreFilter, sortBy]);

  return (
    <div className="music-section-wrap">
      {/* Vinyl Crate Banner */}
      <div className="section-header-banner music-banner">
        <div className="section-banner-title-box">
          <span className="section-banner-icon">🎧</span>
          <div>
            <h2 className="section-banner-heading">VINYL & MIXTAPE CRATE</h2>
            <p className="section-banner-sub">Spinning records, cassette liner notes, and ambient soundscapes.</p>
          </div>
        </div>

        <div className="section-stat-badges">
          <div className="stat-badge">
            <span className="stat-num">{items.length}</span>
            <span className="stat-lbl">RELEASES</span>
          </div>
          <div className="stat-badge">
            <span className="stat-num">{genres.length || 1}</span>
            <span className="stat-lbl">GENRES</span>
          </div>
        </div>
      </div>

      {/* Filter and Sorting Toolbar */}
      <div className="section-filter-bar">
        <div className="filter-group">
          <span className="filter-label">GENRE:</span>
          <button
            className={`filter-btn ${genreFilter === 'all' ? 'active' : ''}`}
            onClick={() => {
              playCassetteClick();
              setGenreFilter('all');
            }}
          >
            ALL ({items.length})
          </button>
          {genres.map((g) => (
            <button
              key={g}
              className={`filter-btn ${genreFilter.toLowerCase() === g.toLowerCase() ? 'active' : ''}`}
              onClick={() => {
                playCassetteClick();
                setGenreFilter(g);
              }}
            >
              {g.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="filter-group right-controls">
          <input
            type="search"
            placeholder="Search album, artist, track..."
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
            <option value="artist">Artist (A-Z)</option>
            <option value="year">Release Year 📅</option>
            <option value="title">Album Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Music Records Container */}
      <div className="music-records-container">
        {filteredAndSorted.length === 0 ? (
          <p className="empty-state">No records match this filter.</p>
        ) : (
          filteredAndSorted.map((r, i) => (
            <MusicRecord
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
