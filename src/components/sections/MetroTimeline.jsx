import { db } from '../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { md, formatDate } from '../../constants';
import { useToast } from '../Toast';

/**
 * Horizontal Metro Map Component for Timeline (◷)
 * Subway line with connected stations, milestone stops,
 * station dates, and memories along the track.
 */
export default function MetroTimeline({ items, admin = false, onEdit, reload }) {
  const toast = useToast();

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
        <span className="metro-line-badge">LINE 1 · PARADISO TRANSIT</span>
        <span className="metro-sub">SCROLL HORIZONTALLY TO TRAVEL THROUGH TIME ➔</span>
      </div>

      <div className="metro-track-scroll">
        <div className="metro-track">
          {/* Continuous Metro Rail Line */}
          <div className="metro-rail-line"></div>

          {items.map((r, i) => {
            const dateStr = r.extra || formatDate(r.date);
            const isAlt = i % 2 === 1;

            return (
              <div
                key={r.id}
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
