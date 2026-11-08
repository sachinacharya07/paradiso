import { useState, useMemo } from 'react';
import BookCard, { parseBookMeta } from './BookCard';
import { playPaperTear, playBeep } from '../../utils/sound';

export default function BookSection({ items, admin = false, onEdit, reload }) {
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'finished', 'reading', 'tbr', '5star'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'rating', 'author', 'title'
  const [search, setSearch] = useState('');

  // Stats
  const stats = useMemo(() => {
    let finished = 0;
    let reading = 0;
    let fiveStar = 0;
    items.forEach((item) => {
      const meta = parseBookMeta(item.extra);
      const st = meta.status.toLowerCase();
      if (st.includes('finish')) finished++;
      if (st.includes('reading')) reading++;
      if (meta.rating.includes('5') || meta.stars.includes('★★★★★')) fiveStar++;
    });
    return { total: items.length, finished, reading, fiveStar };
  }, [items]);

  const filteredAndSorted = useMemo(() => {
    let list = [...items];

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((b) => {
        const meta = parseBookMeta(b.extra);
        return (
          b.title?.toLowerCase().includes(q) ||
          meta.author.toLowerCase().includes(q) ||
          b.body?.toLowerCase().includes(q)
        );
      });
    }

    // Status filter
    if (statusFilter === 'finished') {
      list = list.filter((b) => parseBookMeta(b.extra).status.toLowerCase().includes('finish'));
    } else if (statusFilter === 'reading') {
      list = list.filter((b) => parseBookMeta(b.extra).status.toLowerCase().includes('reading'));
    } else if (statusFilter === 'tbr') {
      list = list.filter((b) => parseBookMeta(b.extra).status.toLowerCase().includes('want'));
    } else if (statusFilter === '5star') {
      list = list.filter((b) => {
        const meta = parseBookMeta(b.extra);
        return meta.rating.includes('5') || meta.stars.includes('★★★★★');
      });
    }

    // Sort
    if (sortBy === 'rating') {
      list.sort((a, b) => {
        const aMeta = parseBookMeta(a.extra);
        const bMeta = parseBookMeta(b.extra);
        return (parseFloat(bMeta.rating) || 0) - (parseFloat(aMeta.rating) || 0);
      });
    } else if (sortBy === 'author') {
      list.sort((a, b) => parseBookMeta(a.extra).author.localeCompare(parseBookMeta(b.extra).author));
    } else if (sortBy === 'title') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else {
      list.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
    }

    return list;
  }, [items, search, statusFilter, sortBy]);

  return (
    <div className="book-section-wrap">
      {/* Library Banner & Summary Header */}
      <div className="section-header-banner book-banner">
        <div className="section-banner-title-box">
          <span className="section-banner-icon">📚</span>
          <div>
            <h2 className="section-banner-heading">LIBRARY & READING LOG</h2>
            <p className="section-banner-sub">Personal library card catalog, quotes, and reading reflections.</p>
          </div>
        </div>

        <div className="section-stat-badges">
          <div className="stat-badge">
            <span className="stat-num">{stats.total}</span>
            <span className="stat-lbl">BOOKS</span>
          </div>
          <div className="stat-badge">
            <span className="stat-num">{stats.finished}</span>
            <span className="stat-lbl">FINISHED</span>
          </div>
          <div className="stat-badge">
            <span className="stat-num">{stats.reading}</span>
            <span className="stat-lbl">READING</span>
          </div>
          <div className="stat-badge">
            <span className="stat-num">{stats.fiveStar}</span>
            <span className="stat-lbl">5-STAR</span>
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
              playPaperTear();
              setStatusFilter('all');
            }}
          >
            ALL ({items.length})
          </button>
          <button
            className={`filter-btn ${statusFilter === 'finished' ? 'active' : ''}`}
            onClick={() => {
              playPaperTear();
              setStatusFilter('finished');
            }}
          >
            ✓ FINISHED ({stats.finished})
          </button>
          <button
            className={`filter-btn ${statusFilter === 'reading' ? 'active' : ''}`}
            onClick={() => {
              playPaperTear();
              setStatusFilter('reading');
            }}
          >
            ⏳ READING ({stats.reading})
          </button>
          <button
            className={`filter-btn ${statusFilter === '5star' ? 'active' : ''}`}
            onClick={() => {
              playPaperTear();
              setStatusFilter('5star');
            }}
          >
            ★★★★★ (5 STARS)
          </button>
        </div>

        <div className="filter-group right-controls">
          <input
            type="search"
            placeholder="Search book or author..."
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
            <option value="newest">Latest Logged</option>
            <option value="rating">Highest Rated ★</option>
            <option value="author">Author (A-Z)</option>
            <option value="title">Book Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Book Cards Grid */}
      <div className="book-cards-container">
        {filteredAndSorted.length === 0 ? (
          <p className="empty-state">No books match this filter.</p>
        ) : (
          filteredAndSorted.map((r, i) => (
            <BookCard
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
