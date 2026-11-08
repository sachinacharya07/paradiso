import { useState, useMemo } from 'react';
import { SEC, NAME, formatDate } from '../../constants';
import { ThematicCard } from '../PostList';
import { playPaperTear, playBeep } from '../../utils/sound';

export default function ArchiveSection({ items, admin = false, onEdit, reload }) {
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' or section key
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [viewMode, setViewMode] = useState('thematic'); // 'thematic', 'grouped', 'table'

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts = {};
    items.forEach((item) => {
      const t = item.type || 'post';
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [items]);

  // Extract distinct years from items
  const distinctYears = useMemo(() => {
    const years = new Set();
    items.forEach((item) => {
      let y = null;
      if (item.date) {
        try {
          const d = item.date.toDate ? item.date.toDate() : new Date(item.date);
          if (!isNaN(d.getFullYear())) y = d.getFullYear().toString();
        } catch {
          // ignore
        }
      }
      if (!y && item.extra) {
        const match = String(item.extra).match(/\b(19\d\d|20\d\d)\b/);
        if (match) y = match[1];
      }
      if (y) years.add(y);
    });
    return Array.from(years).sort().reverse();
  }, [items]);

  // Filtered entries
  const filtered = useMemo(() => {
    let list = [...items];

    // Category filter
    if (activeCategory !== 'all') {
      list = list.filter((item) => (item.type || 'post') === activeCategory);
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.body?.toLowerCase().includes(q) ||
          item.extra?.toLowerCase().includes(q)
      );
    }

    // Year filter
    if (yearFilter !== 'all') {
      list = list.filter((item) => {
        let itemYear = '';
        if (item.date) {
          try {
            const d = item.date.toDate ? item.date.toDate() : new Date(item.date);
            itemYear = d.getFullYear().toString();
          } catch {
            // ignore
          }
        }
        if (!itemYear && item.extra) {
          const match = String(item.extra).match(/\b(19\d\d|20\d\d)\b/);
          if (match) itemYear = match[1];
        }
        return itemYear === yearFilter;
      });
    }

    // Sort newest date first
    list.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));

    return list;
  }, [items, activeCategory, search, yearFilter]);

  // Grouped by section for 'grouped' view mode
  const groupedData = useMemo(() => {
    const map = {};
    filtered.forEach((item) => {
      const type = item.type || 'post';
      if (!map[type]) map[type] = [];
      map[type].push(item);
    });
    return map;
  }, [filtered]);

  return (
    <div className="archive-section-wrap">
      {/* Archive Header Banner */}
      <div className="section-header-banner archive-banner">
        <div className="section-banner-title-box">
          <span className="section-banner-icon">☰</span>
          <div>
            <h2 className="section-banner-heading">THE MASTER ARCHIVE</h2>
            <p className="section-banner-sub">
              Separated archives for films, literature, music, essays, and personal chronicles.
            </p>
          </div>
        </div>

        <div className="section-stat-badges">
          <div className="stat-badge">
            <span className="stat-num">{items.length}</span>
            <span className="stat-lbl">ALL ENTRIES</span>
          </div>
          <div className="stat-badge">
            <span className="stat-num">{Object.keys(categoryCounts).length}</span>
            <span className="stat-lbl">SECTIONS</span>
          </div>
        </div>
      </div>

      {/* Category Pills Navigation */}
      <div className="archive-category-nav">
        <button
          type="button"
          className={`archive-cat-pill ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => {
            playPaperTear();
            setActiveCategory('all');
          }}
        >
          <span>ALL ARCHIVES</span>
          <span className="archive-cat-count">{items.length}</span>
        </button>

        {SEC.map(([k, name, icon]) => {
          const count = categoryCounts[k] || 0;
          if (count === 0 && !admin) return null;
          return (
            <button
              key={k}
              type="button"
              className={`archive-cat-pill ${activeCategory === k ? 'active' : ''}`}
              onClick={() => {
                playPaperTear();
                setActiveCategory(k);
              }}
            >
              <span>{icon} {name}</span>
              <span className="archive-cat-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Toolbar: Search, Year, and View Mode Switcher */}
      <div className="section-filter-bar archive-filter-bar">
        <div className="filter-group">
          <input
            type="search"
            placeholder="Search archive titles, notes, texts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="section-search-input archive-search"
          />

          {distinctYears.length > 0 && (
            <select
              className="section-sort-select"
              value={yearFilter}
              onChange={(e) => {
                playBeep();
                setYearFilter(e.target.value);
              }}
            >
              <option value="all">All Years 📅</option>
              {distinctYears.map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="filter-group view-mode-group">
          <span className="filter-label">VIEW:</span>
          <button
            type="button"
            className={`filter-btn ${viewMode === 'thematic' ? 'active' : ''}`}
            onClick={() => {
              playBeep();
              setViewMode('thematic');
            }}
            title="Thematic Card View"
          >
            🎴 CARDS
          </button>
          <button
            type="button"
            className={`filter-btn ${viewMode === 'grouped' ? 'active' : ''}`}
            onClick={() => {
              playBeep();
              setViewMode('grouped');
            }}
            title="Grouped by Section"
          >
            📂 SECTIONS
          </button>
          <button
            type="button"
            className={`filter-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => {
              playBeep();
              setViewMode('table');
            }}
            title="DOS Table Catalog"
          >
            📋 CATALOG
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {filtered.length === 0 ? (
        <p className="empty-state">No archived entries match your filter.</p>
      ) : viewMode === 'thematic' ? (
        /* 1. Thematic Cards View */
        <div className="archive-cards-flow">
          {filtered.map((r, i) => (
            <ThematicCard
              key={r.id}
              r={r}
              admin={admin}
              onEdit={onEdit}
              reload={reload}
              index={i}
            />
          ))}
        </div>
      ) : viewMode === 'grouped' ? (
        /* 2. Grouped By Section Drawers */
        <div className="archive-grouped-drawers">
          {Object.entries(groupedData).map(([secKey, secEntries]) => {
            const secInfo = SEC.find((s) => s[0] === secKey);
            const secTitle = secInfo ? `${secInfo[2]} ${secInfo[1]}` : secKey.toUpperCase();
            return (
              <details key={secKey} className="archive-drawer-box" open>
                <summary className="archive-drawer-header">
                  <span className="drawer-title">{secTitle}</span>
                  <span className="drawer-count">{secEntries.length} items</span>
                </summary>
                <div className="archive-drawer-content">
                  {secEntries.map((r, i) => (
                    <ThematicCard
                      key={r.id}
                      r={r}
                      admin={admin}
                      onEdit={onEdit}
                      reload={reload}
                      index={i}
                    />
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      ) : (
        /* 3. DOS Catalog Table View */
        <div className="archive-catalog-table-wrap">
          <table className="archive-catalog-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>SECTION</th>
                <th>TITLE</th>
                <th>EXTRA / STATS</th>
                {admin && <th>ACTIONS</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const secInfo = SEC.find((s) => s[0] === r.type);
                return (
                  <tr key={r.id}>
                    <td className="table-date">{formatDate(r.date) || '―'}</td>
                    <td className="table-type">
                      <span className="table-badge">
                        {secInfo ? `${secInfo[2]} ${secInfo[1]}` : r.type || 'POST'}
                      </span>
                    </td>
                    <td className="table-title">
                      <b>{r.title || 'Untitled'}</b>
                      {r.draft && <span className="table-draft-tag"> [DRAFT]</span>}
                    </td>
                    <td className="table-extra">{r.extra || '―'}</td>
                    {admin && (
                      <td className="table-actions">
                        <button
                          type="button"
                          className="table-btn"
                          onClick={() => onEdit?.(r)}
                        >
                          ✎ Edit
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
