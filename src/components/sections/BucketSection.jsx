import { useState, useMemo } from 'react';
import BucketDiary from './BucketDiary';
import { playPaperTear, playBeep } from '../../utils/sound';

export default function BucketSection({ items, admin = false, onEdit, reload }) {
  const [filter, setFilter] = useState('all'); // 'all', 'achieved', 'pending'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'achievedFirst', 'pendingFirst', 'title'

  // Stats
  const stats = useMemo(() => {
    let achieved = 0;
    items.forEach((item) => {
      if (item.extra && String(item.extra).trim().length > 0) {
        achieved++;
      }
    });
    const pending = items.length - achieved;
    const percent = items.length > 0 ? Math.round((achieved / items.length) * 100) : 0;
    return { total: items.length, achieved, pending, percent };
  }, [items]);

  const filteredAndSorted = useMemo(() => {
    let list = [...items];

    if (filter === 'achieved') {
      list = list.filter((b) => b.extra && String(b.extra).trim().length > 0);
    } else if (filter === 'pending') {
      list = list.filter((b) => !b.extra || String(b.extra).trim().length === 0);
    }

    if (sortBy === 'achievedFirst') {
      list.sort((a, b) => (b.extra ? 1 : 0) - (a.extra ? 1 : 0));
    } else if (sortBy === 'pendingFirst') {
      list.sort((a, b) => (a.extra ? 1 : 0) - (b.extra ? 1 : 0));
    } else if (sortBy === 'title') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else {
      list.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
    }

    return list;
  }, [items, filter, sortBy]);

  return (
    <div className="bucket-section-wrap">
      {/* Life Ledger Banner */}
      <div className="section-header-banner bucket-banner">
        <div className="section-banner-title-box">
          <span className="section-banner-icon">☑</span>
          <div>
            <h2 className="section-banner-heading">LIFE LEDGER & BUCKET LIST</h2>
            <p className="section-banner-sub">Dreams, milestones, and achievements stamped into the permanent record.</p>
          </div>
        </div>

        {/* Progress Bar & Badges */}
        <div className="bucket-progress-box">
          <div className="bucket-progress-bar-track">
            <div
              className="bucket-progress-bar-fill"
              style={{ width: `${stats.percent}%` }}
            ></div>
          </div>
          <div className="bucket-progress-labels">
            <span><b>{stats.achieved}</b> of <b>{stats.total}</b> achieved</span>
            <span className="percent-badge">{stats.percent}% COMPLETE</span>
          </div>
        </div>
      </div>

      {/* Filter and Sorting Toolbar */}
      <div className="section-filter-bar">
        <div className="filter-group">
          <span className="filter-label">SHOW:</span>
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => {
              playPaperTear();
              setFilter('all');
            }}
          >
            ALL GOALS ({items.length})
          </button>
          <button
            className={`filter-btn ${filter === 'achieved' ? 'active' : ''}`}
            onClick={() => {
              playPaperTear();
              setFilter('achieved');
            }}
          >
            ✓ ACHIEVED ({stats.achieved})
          </button>
          <button
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => {
              playPaperTear();
              setFilter('pending');
            }}
          >
            ○ IN PROGRESS ({stats.pending})
          </button>
        </div>

        <div className="filter-group right-controls">
          <select
            className="section-sort-select"
            value={sortBy}
            onChange={(e) => {
              playBeep();
              setSortBy(e.target.value);
            }}
          >
            <option value="newest">Latest Added</option>
            <option value="achievedFirst">Achieved First ✓</option>
            <option value="pendingFirst">In Progress First ○</option>
            <option value="title">Goal Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Bucket List Container */}
      <div className="bucket-diary-list">
        {filteredAndSorted.length === 0 ? (
          <p className="empty-state">No goals match this filter.</p>
        ) : (
          filteredAndSorted.map((r, i) => (
            <BucketDiary
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
