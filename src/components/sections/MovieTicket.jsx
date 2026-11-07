import { useState } from 'react';
import { db } from '../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { md, formatDate } from '../../constants';
import { useToast } from '../Toast';

/**
 * Cinema Ticket Stub Component for Movies (▶)
 * Horizontal retro cinema ticket with perforated tear-line,
 * barcode graphic, rating on the stub, and review inline.
 */
export default function MovieTicket({ r, admin = false, onEdit, reload, index = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const toast = useToast();
  const dateStr = formatDate(r.date);

  // Parse rating & year from extra (e.g. "4/5 · 2019" or "4.5/5")
  const extraText = r.extra || '';
  const parts = extraText.split('·').map(s => s.trim());
  const rating = parts[0] || '';
  const year = parts[1] || '';

  const handleDelete = async () => {
    if (!window.confirm(`Delete review for "${r.title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'entries', r.id));
      toast('Movie review deleted', 'success');
      reload();
    } catch (err) {
      toast('Failed to delete: ' + err.message, 'error');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}#review`;
    navigator.clipboard.writeText(url).then(
      () => toast('Link copied', 'success'),
      () => toast('Failed to copy', 'error')
    );
  };

  return (
    <article
      className="movie-ticket card-enter"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      {/* Main Ticket Body */}
      <div className="ticket-main">
        <div className="ticket-header">
          <span className="ticket-badge">ADMIT ONE · CINEMA</span>
          <span className="ticket-date">{year || dateStr}</span>
        </div>

        <div className="ticket-content-row">
          {r.image && (
            <div className="ticket-poster-wrap">
              <img
                src={r.image}
                alt={r.title || 'Movie poster'}
                className="ticket-poster"
                loading="lazy"
              />
            </div>
          )}

          <div className="ticket-details">
            <h3 className="ticket-title" onClick={() => setExpanded(!expanded)}>
              {r.title || 'Untitled Movie'}
            </h3>

            {r.body && (
              <div
                className={`ticket-review md ${expanded ? 'expanded' : 'collapsed'}`}
                dangerouslySetInnerHTML={md(r.body)}
              />
            )}

            {r.body && r.body.length > 200 && (
              <button
                className="ticket-toggle-btn"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? '▲ show less' : '▼ read full review'}
              </button>
            )}
          </div>
        </div>

        {/* Action icons */}
        <div className="ticket-footer-actions">
          <button className="card-action-btn" onClick={handleShare} title="Copy link">
            ⌘
          </button>
          {admin && (
            <>
              <button className="card-action-btn" onClick={() => onEdit(r)} title="Edit">
                ✎
              </button>
              <button className="card-action-btn" onClick={handleDelete} title="Delete">
                ✕
              </button>
            </>
          )}
        </div>
      </div>

      {/* Perforated Divider */}
      <div className="ticket-perforation">
        <span className="perf-notch notch-top"></span>
        <div className="perf-line"></div>
        <span className="perf-notch notch-bottom"></span>
      </div>

      {/* Tear-off Ticket Stub */}
      <div className="ticket-stub">
        <div className="stub-tag">PARADISO</div>
        <div className="stub-rating-box">
          <span className="stub-rating-label">SCORE</span>
          <span className="stub-rating-val">{rating || '★'}</span>
        </div>
        <div className="stub-barcode">
          <div className="barcode-bars"></div>
          <span className="barcode-num">№ {String(index + 1001).padStart(5, '0')}</span>
        </div>
      </div>
    </article>
  );
}
