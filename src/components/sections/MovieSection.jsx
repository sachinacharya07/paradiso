import { useState, useMemo } from 'react';
import MovieTicket from './MovieTicket';
import { playPaperTear, playBeep } from '../../utils/sound';

/**
 * Filter and Sortable Movie Section (▶)
 * Filter by rating stars (All, 5 Stars, 4+ Stars) and sort by release year or rating.
 */
export default function MovieSection({ items, admin = false, onEdit, reload }) {
  const [starFilter, setStarFilter] = useState('all'); // 'all', '5', '4plus'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'rating', 'year'

  // Extract numeric rating helper
  const getRatingValue = (r) => {
    if (!r.extra) return 0;
    const match = String(r.extra).match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+)/);
    if (match) {
      const val = parseFloat(match[1]);
      const max = parseFloat(match[2]);
      return max === 10 ? val / 2 : (val / max) * 5;
    }
    const singleMatch = String(r.extra).match(/(\d+(?:\.\d+)?)/);
    if (singleMatch) {
      const val = parseFloat(singleMatch[1]);
      return val > 5 ? val / 2 : val;
    }
    const stars = (String(r.extra).match(/★/g) || []).length;
    return stars || 0;
  };

  const getYearValue = (r) => {
    if (!r.extra) return 0;
    const match = String(r.extra).match(/\b(19\d\d|20\d\d)\b/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const filteredAndSorted = useMemo(() => {
    let list = [...items];

    // Filter by stars
    if (starFilter === '5') {
      list = list.filter((r) => getRatingValue(r) >= 4.8);
    } else if (starFilter === '4plus') {
      list = list.filter((r) => getRatingValue(r) >= 3.8);
    }

    // Sort
    if (sortBy === 'rating') {
      list.sort((a, b) => getRatingValue(b) - getRatingValue(a));
    } else if (sortBy === 'year') {
      list.sort((a, b) => getYearValue(b) - getYearValue(a));
    } else {
      // Default newest by date
      list.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
    }

    return list;
  }, [items, starFilter, sortBy]);

  return (
    <div className="movie-section-wrap">
      {/* Filter and Sorting Toolbar */}
      <div className="movie-filter-bar">
        <div className="filter-group">
          <span className="filter-label">FILTER:</span>
          <button
            className={`filter-btn ${starFilter === 'all' ? 'active' : ''}`}
            onClick={() => {
              playPaperTear();
              setStarFilter('all');
            }}
          >
            ALL ({items.length})
          </button>
          <button
            className={`filter-btn ${starFilter === '5' ? 'active' : ''}`}
            onClick={() => {
              playPaperTear();
              setStarFilter('5');
            }}
          >
            ★★★★★ (5 STARS)
          </button>
          <button
            className={`filter-btn ${starFilter === '4plus' ? 'active' : ''}`}
            onClick={() => {
              playPaperTear();
              setStarFilter('4plus');
            }}
          >
            ★★★★+ (4+ STARS)
          </button>
        </div>

        <div className="filter-group sort-group">
          <span className="filter-label">SORT:</span>
          <select
            className="movie-sort-select"
            value={sortBy}
            onChange={(e) => {
              playBeep();
              setSortBy(e.target.value);
            }}
          >
            <option value="newest">Latest Added</option>
            <option value="rating">Highest Rated ★</option>
            <option value="year">Release Year 📅</option>
          </select>
        </div>
      </div>

      {/* Ticket List */}
      <div className="movie-tickets-container">
        {filteredAndSorted.length === 0 ? (
          <p className="empty-state">No movie reviews match this filter.</p>
        ) : (
          filteredAndSorted.map((r, i) => (
            <MovieTicket
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
