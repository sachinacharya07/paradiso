import { useState } from 'react';
import { db } from '../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { md, formatDate } from '../../constants';
import { useToast } from '../Toast';

/**
 * Smart parser to extract the movie rating score and release year
 * regardless of format (e.g. "4.5/5 · 2024", "8/10", "5/5", "2023 · 4", "★★★★☆")
 */
function parseMovieRating(extra) {
  if (!extra) return { score: 'UNRATED', stars: '', year: '' };

  const raw = String(extra).trim();

  // 1. Detect 4-digit release year (e.g. 1999, 2024)
  const yearMatch = raw.match(/\b(19\d\d|20\d\d)\b/);
  const year = yearMatch ? yearMatch[1] : '';

  // 2. Detect direct star characters if entered (e.g. ★★★★☆)
  const starCharsMatch = raw.match(/[★☆]+/);
  if (starCharsMatch) {
    const starStr = starCharsMatch[0];
    const fullCount = (starStr.match(/★/g) || []).length;
    return {
      score: `${fullCount}/5`,
      stars: starStr,
      year,
    };
  }

  // 3. Remove year from rating string to isolate score
  let ratingPart = raw;
  if (year) {
    ratingPart = ratingPart.replace(year, '').replace(/·|-|,/g, ' ').trim();
  }

  // 4. Match fraction patterns: "4.5/5", "8/10", "4 / 5", "9.5/10"
  const fractionMatch = ratingPart.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+)/);
  if (fractionMatch) {
    const val = parseFloat(fractionMatch[1]);
    const max = parseFloat(fractionMatch[2]);
    const normalizedToFive = max === 10 ? val / 2 : (val / max) * 5;
    return {
      score: `${val}/${max}`,
      stars: renderStarSymbols(normalizedToFive),
      numeric: val,
      max,
      year,
    };
  }

  // 5. Match standalone number: e.g. "4.5" or "8" or "4"
  const singleNumMatch = ratingPart.match(/(\d+(?:\.\d+)?)/);
  if (singleNumMatch) {
    const val = parseFloat(singleNumMatch[1]);
    const max = val > 5 ? 10 : 5;
    const normalizedToFive = max === 10 ? val / 2 : val;
    return {
      score: `${val}/${max}`,
      stars: renderStarSymbols(normalizedToFive),
      numeric: val,
      max,
      year,
    };
  }

  return { score: raw, stars: '', year };
}

function renderStarSymbols(ratingOutOfFive) {
  const clamped = Math.max(0, Math.min(5, ratingOutOfFive));
  const full = Math.floor(clamped);
  const remainder = clamped - full;
  const hasHalf = remainder >= 0.25 && remainder < 0.75;
  const roundUp = remainder >= 0.75;

  let stars = '★'.repeat(full + (roundUp ? 1 : 0));
  if (hasHalf) stars += '½';
  const remaining = 5 - (full + (roundUp || hasHalf ? 1 : 0));
  if (remaining > 0) stars += '☆'.repeat(remaining);
  return stars;
}

/**
 * Cinema Ticket Stub Component for Movies (▶)
 * Horizontal retro cinema ticket with perforated tear-line,
 * barcode graphic, explicit user rating on the stub, and review inline.
 */
export default function MovieTicket({ r, admin = false, onEdit, reload, index = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const toast = useToast();
  const dateStr = formatDate(r.date);

  // Extract score and year
  const { score, stars, year } = parseMovieRating(r.extra);

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
          <div className="ticket-header-meta">
            {stars && <span className="ticket-stars-inline">{stars}</span>}
            <span className="ticket-date">{year || dateStr}</span>
          </div>
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

      {/* Tear-off Ticket Stub with explicit Score */}
      <div className="ticket-stub">
        <div className="stub-tag">PARADISO</div>
        <div className="stub-rating-box">
          <span className="stub-rating-label">RATING</span>
          <span className="stub-rating-val">{score}</span>
          {stars && <span className="stub-stars-val">{stars}</span>}
        </div>
        <div className="stub-barcode">
          <div className="barcode-bars"></div>
          <span className="barcode-num">№ {String(index + 1001).padStart(5, '0')}</span>
        </div>
      </div>
    </article>
  );
}
