import { useRef } from 'react';
import { db } from '../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { md, formatDate } from '../../constants';
import { useToast } from '../Toast';
import { playBeep } from '../../utils/sound';

/**
 * Horizontal Metro Map Component for Timeline (◷)
 * Subway line with connected stations, milestone stops,
 * and quick-jump year pills for fast navigation.
 */
export default function MetroTimeline({ items, admin = false, onEdit, reload }) {
  const toast = useToast();
  const trackRef = useRef(null);

  // Extract unique years from extra or date for quick-jump station pills
  const years = Array.from(
    new Set(
      items
        .map((r) => {
          const match = String(r.extra || '').match(/\b(19\d\d|20\d\d)\b/);
          if (match) return match[1];
          const d = formatDate(r.date);
          const dMatch = d.match(/\b(19\d\d|20\d\d)\b/);
          return dMatch ? dMatch[1] : null;
        })
        .filter(Boolean)
    )
  ).sort();

  const handleJumpToYear = (yr) => {
    playBeep();
    const el = document.getElementById(`metro-station-yr-${yr}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  const handleDelete = async (r) => {
    if (!window.confirm(`Delete milestone "${r.title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'entries', r.id));
      toast('Milestone deleted', 'success');
      reload();
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
      <div className="metro-header-banner">
        <div className="metro-header-left">
          <span className="metro-line-badge">LINE 1 · PARADISO TRANSIT</span>
          <span className="metro-sub">SCROLL OR JUMP ACROSS STATIONS ➔</span>
        </div>

        {/* Quick-jump Year Station Pills */}
        {years.length > 0 && (
          <div className="metro-year-pills">
            <span className="pills-label">JUMP:</span>
            {years.map((yr) => (
              <button
                key={yr}
                className="metro-year-pill-btn"
                onClick={() => handleJumpToYear(yr)}
              >
                {yr}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="metro-track-scroll" ref={trackRef}>
        <div className="metro-track">
          {/* Continuous Metro Rail Line */}
          <div className="metro-rail-line"></div>

          {items.map((r, i) => {
            const dateStr = r.extra || formatDate(r.date);
            const isAlt = i % 2 === 1;
            const yearMatch = String(dateStr).match(/\b(19\d\d|20\d\d)\b/);
            const yrId = yearMatch ? `metro-station-yr-${yearMatch[1]}` : undefined;

            return (
              <div
                key={r.id}
                id={yrId}
                className={`metro-station ${isAlt ? 'station-down' : 'station-up'}`}
              >
                {/* Station Node / Transfer Circle */}
                <div className="metro-node">
                  <div className="metro-node-inner"></div>
                </div>

                {/* Station Card */}
                <div className="metro-card">
                  <div className="metro-station-name">
                    <span className="metro-station-dot">●</span>
                    <span className="metro-station-date">{dateStr || 'ORIGIN'}</span>
                  </div>

                  <h3 className="metro-station-title">{r.title || 'Milestone'}</h3>

                  {r.image && (
                    <div className="metro-image-wrap">
                      <img src={r.image} alt={r.title || 'Memory'} loading="lazy" />
                    </div>
                  )}

                  {r.body && (
                    <div className="metro-station-desc md" dangerouslySetInnerHTML={md(r.body)} />
                  )}

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
            );
          })}
        </div>
      </div>
    </div>
  );
}
