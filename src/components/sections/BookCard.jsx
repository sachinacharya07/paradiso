import { useState } from 'react';
import { db } from '../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { md, formatDate } from '../../constants';
import { useToast } from '../Toast';
import { playPaperTear } from '../../utils/sound';

/**
 * Parse book metadata from extra string (e.g. "Haruki Murakami · 5/5 · Finished · 1987")
 */
export function parseBookMeta(extra) {
  if (!extra) {
    return { author: '', rating: '4/5', stars: '★★★★☆', status: 'Finished', year: '' };
  }

  const parts = String(extra).split('·').map(p => p.trim());
  let author = '';
  let rating = '';
  let status = '';
  let year = '';

  parts.forEach(part => {
    if (/\b(19\d\d|20\d\d)\b/.test(part) && !year) {
      year = part.match(/\b(19\d\d|20\d\d)\b/)[1];
    } else if (/(\d+(?:\.\d+)?)\s*\/\s*(\d+)/.test(part) || /[★☆]+/.test(part)) {
      rating = part;
    } else if (/(finished|reading|want to read|tbr|abandoned)/i.test(part)) {
      status = part;
    } else if (!author) {
      author = part;
    }
  });

  // Calculate stars
  let stars = '★★★★☆';
  const frac = rating.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+)/);
  if (frac) {
    const val = parseFloat(frac[1]);
    const max = parseFloat(frac[2]);
    const normalized = max === 10 ? Math.round(val / 2) : Math.round(val);
    stars = '★'.repeat(Math.max(1, Math.min(5, normalized))) + '☆'.repeat(Math.max(0, 5 - normalized));
  } else if (/[★☆]+/.test(rating)) {
    stars = rating;
  }

  return {
    author: author || 'Unknown Author',
    rating: rating || '4/5',
    stars,
    status: status || 'Finished',
    year,
  };
}

/**
 * Retro Library Checkout Card Component for Books (📚)
 */
export default function BookCard({ r, admin = false, onEdit, reload, index = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const toast = useToast();
  const dateStr = formatDate(r.date);
  const { author, rating, stars, status, year } = parseBookMeta(r.extra);

  const handleDelete = async () => {
    if (!window.confirm(`Delete book "${r.title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'entries', r.id));
      toast('Book removed from library', 'success');
      reload?.();
    } catch (err) {
      toast('Failed to delete: ' + err.message, 'error');
    }
  };

  const getStatusBadge = (st) => {
    const s = String(st).toLowerCase();
    if (s.includes('reading')) {
      return <span className="book-status-pill status-reading">⏳ CURRENTLY READING</span>;
    }
    if (s.includes('want')) {
      return <span className="book-status-pill status-tbr">🔖 WANT TO READ</span>;
    }
    return <span className="book-status-pill status-finished">✓ FINISHED</span>;
  };

  return (
    <article
      className="book-library-card slide-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="library-card-header">
        <div className="library-stamps">
          <span className="library-stamp-circle">PARADISO LIBRARY</span>
          <span className="library-dewey">CAT: {r.id?.slice(0, 5).toUpperCase() || 'LIB-820'}</span>
        </div>
        <div className="library-status-box">
          {getStatusBadge(status)}
        </div>
      </div>

      <div className="library-card-body">
        {r.image && (
          <div className="book-cover-frame">
            <img src={r.image} alt={r.title || 'Book Cover'} loading="lazy" />
          </div>
        )}

        <div className="book-details">
          <h3 className="book-title">{r.title || 'Untitled Book'}</h3>
          <p className="book-author">by <b>{author}</b> {year && <span className="book-year">({year})</span>}</p>

          <div className="book-rating-row">
            <span className="book-stars">{stars}</span>
            <span className="book-score-label">{rating}</span>
            {dateStr && <span className="book-log-date">Logged: {dateStr}</span>}
          </div>

          {r.body && (
            <div className={`book-review-text ${expanded ? 'expanded' : 'collapsed'}`}>
              <div className="md" dangerouslySetInnerHTML={md(r.body)} />
            </div>
          )}

          {r.body && r.body.length > 250 && (
            <button
              type="button"
              className="book-expand-btn"
              onClick={() => {
                playPaperTear();
                setExpanded(!expanded);
              }}
            >
              {expanded ? '▲ Close Card' : '▼ Read Full Notes & Quotes'}
            </button>
          )}
        </div>
      </div>

      {admin && (
        <div className="card-admin-bar">
          <button onClick={() => onEdit?.(r)} title="Edit book entry">
            ✎ Edit
          </button>
          <button onClick={handleDelete} className="del" title="Delete book entry">
            ✕ Delete
          </button>
        </div>
      )}
    </article>
  );
}
