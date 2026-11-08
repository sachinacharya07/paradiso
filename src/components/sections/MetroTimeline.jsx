import { useState, useRef, useMemo } from 'react';
import { db } from '../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { md, formatDate } from '../../constants';
import { useToast } from '../Toast';
import { playSubwayChime, playBeep, playPaperTear } from '../../utils/sound';

/**
 * Determine a transit line color and label from milestone extra/title/content
 */
function getStationLine(r) {
  const text = `${r.title || ''} ${r.extra || ''} ${r.body || ''}`.toLowerCase();
  if (text.includes('code') || text.includes('react') || text.includes('work') || text.includes('job') || text.includes('graduat') || text.includes('dev')) {
    return { id: 'red', name: 'RED LINE · TECH & CAREER', color: '#e63946', badge: '🔴' };
  }
  if (text.includes('travel') || text.includes('moved') || text.includes('trip') || text.includes('city') || text.includes('delhi') || text.includes('tokyo') || text.includes('flight')) {
    return { id: 'blue', name: 'BLUE LINE · TRAVEL & CITIES', color: '#00b4d8', badge: '🔵' };
  }
  if (text.includes('music') || text.includes('write') || text.includes('poem') || text.includes('art') || text.includes('film') || text.includes('creative')) {
    return { id: 'purple', name: 'PURPLE LINE · ARTS & SOUND', color: '#9d4edd', badge: '🟣' };
  }
  return { id: 'gold', name: 'GOLD LINE · LIFE MILESTONES', color: '#ffb703', badge: '🟡' };
}

/**
 * Highly Designed Metro Transit Station & Timeline Component (◷)
 * Features:
 * - LED Departure & Arrival Status Board
 * - Clickable mini-map route schematic
 * - Boarding Pass / Subway Ticket styling with barcode & inspector stamp
 * - View mode toggle: Panoramic Rail Track vs Vertical Route Map
 * - Subway two-tone chime audio feedback
 */
export default function MetroTimeline({ items, admin = false, onEdit, reload }) {
  const [viewMode, setViewMode] = useState('rail'); // 'rail' (horizontal) or 'vertical'
  const [activeLine, setActiveLine] = useState('all'); // 'all', 'red', 'blue', 'gold', 'purple'
  const [activeStationId, setActiveStationId] = useState(null);
  const trackRef = useRef(null);
  const toast = useToast();

  // Extract sorted years for stations
  const years = useMemo(() => {
    const set = new Set();
    items.forEach((r) => {
      const match = String(r.extra || '').match(/\b(19\d\d|20\d\d)\b/);
      if (match) set.add(match[1]);
      const d = formatDate(r.date);
      const dMatch = d.match(/\b(19\d\d|20\d\d)\b/);
      if (dMatch) set.add(dMatch[1]);
    });
    return Array.from(set).sort();
  }, [items]);

  // Filter items by line
  const filteredItems = useMemo(() => {
    if (activeLine === 'all') return items;
    return items.filter((r) => getStationLine(r).id === activeLine);
  }, [items, activeLine]);

  const handleJumpToYear = (yr) => {
    playSubwayChime();
    const el = document.getElementById(`metro-station-yr-${yr}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  const handleStationClick = (id) => {
    playSubwayChime();
    setActiveStationId(id);
    const el = document.getElementById(`station-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  const handleDelete = async (r) => {
    if (!window.confirm(`Delete station milestone "${r.title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'entries', r.id));
      toast('Station milestone deleted', 'success');
      reload?.();
    } catch (err) {
      toast('Failed to delete: ' + err.message, 'error');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}#timeline`;
    navigator.clipboard.writeText(url).then(
      () => toast('Link copied', 'success'),
      () => toast('Failed to copy', 'error')
    );
  };

  return (
    <div className="metro-timeline-container">
      {/* 1. RETRO LED TRANSIT DEPARTURE BOARD BANNER */}
      <div className="transit-led-board">
        <div className="transit-led-top-strip">
          <div className="transit-led-badge">
            <span className="led-train-ico">🚊</span> PARADISO METRO TRANSIT · RAPID RAIL
          </div>
          <div className="transit-status-indicator">
            <span className="led-green-dot"></span> LINE 1: ALL TRACKS OPERATIONAL
          </div>
        </div>

        <div className="transit-led-main-display">
          <div className="led-display-col">
            <span className="led-sub-label">CURRENT HORIZON</span>
            <span className="led-glow-text">{years[years.length - 1] || '2026'} CENTRAL TERMINUS</span>
          </div>
          <div className="led-display-col">
            <span className="led-sub-label">TOTAL STOPS</span>
            <span className="led-glow-text">{items.length} MILESTONE STATIONS</span>
          </div>
          <div className="led-display-col">
            <span className="led-sub-label">SCHEDULE</span>
            <span className="led-glow-text">CONTINUOUS TRANSIT</span>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE ROUTE SCHEMATIC MINI-MAP STRIP */}
      {items.length > 0 && (
        <div className="metro-schematic-strip">
          <span className="schematic-label">TRANSIT MAP:</span>
          <div className="schematic-track">
            {items.map((r, idx) => {
              const line = getStationLine(r);
              const dateStr = r.extra || formatDate(r.date);
              const isSelected = activeStationId === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  className={`schematic-node-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleStationClick(r.id)}
                  title={`Stop #${idx + 1}: ${r.title || 'Station'} (${dateStr})`}
                  style={{ '--line-color': line.color }}
                >
                  <span className="schematic-node-dot"></span>
                  <span className="schematic-station-title">{r.title || `Stop ${idx + 1}`}</span>
                  <span className="schematic-station-date">{dateStr || ''}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. CONTROLS: LINE FILTERS, YEAR JUMPERS, & VIEW SWITCHER */}
      <div className="metro-controls-bar">
        {/* Transit Line Filters */}
        <div className="metro-lines-filter">
          <span className="controls-label">LINE:</span>
          <button
            type="button"
            className={`metro-line-pill ${activeLine === 'all' ? 'active' : ''}`}
            onClick={() => {
              playPaperTear();
              setActiveLine('all');
            }}
          >
            ALL ROUTES ({items.length})
          </button>
          <button
            type="button"
            className={`metro-line-pill line-red ${activeLine === 'red' ? 'active' : ''}`}
            onClick={() => {
              playPaperTear();
              setActiveLine('red');
            }}
          >
            🔴 TECH & WORK
          </button>
          <button
            type="button"
            className={`metro-line-pill line-blue ${activeLine === 'blue' ? 'active' : ''}`}
            onClick={() => {
              playPaperTear();
              setActiveLine('blue');
            }}
          >
            🔵 TRAVEL & MOVES
          </button>
          <button
            type="button"
            className={`metro-line-pill line-purple ${activeLine === 'purple' ? 'active' : ''}`}
            onClick={() => {
              playPaperTear();
              setActiveLine('purple');
            }}
          >
            🟣 CREATIVE & ARTS
          </button>
        </div>

        {/* Quick-jump Year Station Pills & View Mode */}
        <div className="metro-right-controls">
          {years.length > 0 && (
            <div className="metro-year-pills">
              <span className="controls-label">STATION JUMP:</span>
              {years.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  className="metro-year-pill-btn"
                  onClick={() => handleJumpToYear(yr)}
                >
                  {yr}
                </button>
              ))}
            </div>
          )}

          {/* View Mode Switcher */}
          <div className="view-mode-buttons">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'rail' ? 'active' : ''}`}
              onClick={() => {
                playBeep();
                setViewMode('rail');
              }}
              title="Horizontal Panoramic Subway Rail"
            >
              🚇 RAIL
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'vertical' ? 'active' : ''}`}
              onClick={() => {
                playBeep();
                setViewMode('vertical');
              }}
              title="Vertical Chronological Route Map"
            >
              📜 ROUTE
            </button>
          </div>
        </div>
      </div>

      {/* 4. MAIN TRACK RENDER */}
      {filteredItems.length === 0 ? (
        <p className="empty-state">No stations match this line filter.</p>
      ) : viewMode === 'rail' ? (
        /* ================= A. HORIZONTAL PANORAMIC RAIL TRACK ================= */
        <div className="metro-track-scroll" ref={trackRef}>
          <div className="metro-track">
            {/* Glowing Subway Rail Track */}
            <div className="metro-rail-line">
              <div className="rail-glow-core"></div>
            </div>

            {filteredItems.map((r, i) => {
              const line = getStationLine(r);
              const dateStr = r.extra || formatDate(r.date);
              const isAlt = i % 2 === 1;
              const yearMatch = String(dateStr).match(/\b(19\d\d|20\d\d)\b/);
              const yrId = yearMatch ? `metro-station-yr-${yearMatch[1]}` : undefined;
              const isSelected = activeStationId === r.id;

              return (
                <div
                  key={r.id}
                  id={yrId || `station-${r.id}`}
                  className={`metro-station ${isAlt ? 'station-down' : 'station-up'} ${isSelected ? 'highlight-station' : ''}`}
                  style={{ '--line-color': line.color }}
                >
                  {/* Station Node / Illuminated Transfer Circle */}
                  <div
                    className="metro-node"
                    onClick={() => handleStationClick(r.id)}
                    title={`Stop: ${r.title}`}
                  >
                    <div className="metro-node-inner">
                      <span className="station-number">{i + 1}</span>
                    </div>
                  </div>

                  {/* Retro Transit Boarding Pass / Subway Ticket Card */}
                  <div className="metro-card transit-ticket">
                    {/* Left Stub: Barcode & Pass ID */}
                    <div className="ticket-stub-edge">
                      <div className="ticket-barcode">|||| ||||| ||||| ||||</div>
                      <span className="ticket-pass-id">STN-{String(i + 1).padStart(2, '0')}</span>
                    </div>

                    {/* Main Ticket Body */}
                    <div className="ticket-main-content">
                      <div className="ticket-header-strip">
                        <span className="ticket-line-badge" style={{ backgroundColor: line.color }}>
                          {line.badge} {line.name}
                        </span>
                        <span className="ticket-date-pill">{dateStr || 'TRANSIT LOG'}</span>
                      </div>

                      <h3 className="metro-station-title">{r.title || 'Milestone Station'}</h3>

                      {r.image && (
                        <div className="metro-carriage-window">
                          <img src={r.image} alt={r.title || 'Station View'} loading="lazy" />
                          <span className="window-glare"></span>
                        </div>
                      )}

                      {r.body && (
                        <div className="metro-station-desc md" dangerouslySetInnerHTML={md(r.body)} />
                      )}

                      {/* Ticket Footer with Inspector Stamp & Actions */}
                      <div className="ticket-footer-strip">
                        <span className="inspector-stamp">✓ VALIDATED: SACHIN</span>
                        <div className="card-actions metro-actions">
                          <button className="card-action-btn" onClick={handleShare} title="Copy link">
                            ⌘
                          </button>
                          {admin && (
                            <>
                              <button className="card-action-btn" onClick={() => onEdit(r)} title="Edit">
                                ✎
                              </button>
                              <button className="card-action-btn" onClick={() => handleDelete(r)} title="Delete">
                                ✕
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ================= B. VERTICAL CHRONOLOGICAL ROUTE MAP ================= */
        <div className="metro-vertical-route-map">
          <div className="vertical-spine-track"></div>

          {filteredItems.map((r, i) => {
            const line = getStationLine(r);
            const dateStr = r.extra || formatDate(r.date);
            const yearMatch = String(dateStr).match(/\b(19\d\d|20\d\d)\b/);
            const yrId = yearMatch ? `metro-station-yr-${yearMatch[1]}` : undefined;

            return (
              <div
                key={r.id}
                id={yrId || `station-${r.id}`}
                className="vertical-station-row"
                style={{ '--line-color': line.color }}
              >
                {/* Pole & Station Node */}
                <div className="vertical-station-pole">
                  <div className="vertical-node-circle">
                    <span className="vertical-stn-num">{i + 1}</span>
                  </div>
                </div>

                {/* Ticket Card */}
                <div className="metro-card transit-ticket vertical-ticket">
                  <div className="ticket-header-strip">
                    <span className="ticket-line-badge" style={{ backgroundColor: line.color }}>
                      {line.badge} {line.name}
                    </span>
                    <span className="ticket-date-pill">{dateStr || 'TRANSIT LOG'}</span>
                  </div>

                  <h3 className="metro-station-title">{r.title || 'Milestone Station'}</h3>

                  {r.image && (
                    <div className="metro-carriage-window">
                      <img src={r.image} alt={r.title || 'Station View'} loading="lazy" />
                    </div>
                  )}

                  {r.body && (
                    <div className="metro-station-desc md" dangerouslySetInnerHTML={md(r.body)} />
                  )}

                  <div className="ticket-footer-strip">
                    <span className="inspector-stamp">✓ VALIDATED: SACHIN</span>
                    <div className="card-actions metro-actions">
                      <button className="card-action-btn" onClick={handleShare} title="Copy link">
                        ⌘
                      </button>
                      {admin && (
                        <>
                          <button className="card-action-btn" onClick={() => onEdit(r)} title="Edit">
                            ✎
                          </button>
                          <button className="card-action-btn" onClick={() => handleDelete(r)} title="Delete">
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
