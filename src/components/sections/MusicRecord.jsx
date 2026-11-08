import { useState } from 'react';
import { db } from '../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { md, formatDate } from '../../constants';
import { useToast } from '../Toast';
import { playCassetteClick } from '../../utils/sound';

/**
 * Parse music metadata from extra (e.g. "Tatsuro Yamashita · City Pop · 1982 · Sparkle")
 */
export function parseMusicMeta(extra) {
  if (!extra) {
    return { artist: 'Unknown Artist', genre: 'Eclectic', year: '', favTrack: '' };
  }

  const parts = String(extra).split('·').map(p => p.trim());
  let artist = parts[0] || '';
  let genre = parts[1] || '';
  let year = '';
  let favTrack = '';

  parts.forEach((p, idx) => {
    if (/\b(19\d\d|20\d\d)\b/.test(p) && !year) {
      year = p.match(/\b(19\d\d|20\d\d)\b/)[1];
    } else if (idx > 1 && !favTrack) {
      favTrack = p;
    }
  });

  return {
    artist: artist || 'Artist',
    genre: genre || 'Soundtrack',
    year,
    favTrack,
  };
}

/**
 * Vinyl Record / Mixtape Sleeve Component for Music (🎧)
 */
export default function MusicRecord({ r, admin = false, onEdit, reload, index = 0 }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const toast = useToast();
  const dateStr = formatDate(r.date);
  const { artist, genre, year, favTrack } = parseMusicMeta(r.extra);

  const handleDelete = async () => {
    if (!window.confirm(`Delete music entry "${r.title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'entries', r.id));
      toast('Music entry removed', 'success');
      reload?.();
    } catch (err) {
      toast('Failed to delete: ' + err.message, 'error');
    }
  };

  const toggleSpin = () => {
    playCassetteClick();
    setIsPlaying(!isPlaying);
  };

  return (
    <article
      className="music-record-sleeve slide-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="vinyl-assembly">
        {/* Vinyl Disc that slides out */}
        <div
          className={`vinyl-disc ${isPlaying ? 'spinning' : ''}`}
          onClick={toggleSpin}
          title="Click to spin vinyl record"
        >
          <div className="vinyl-grooves">
            <div className="vinyl-center-label">
              <span className="vinyl-center-text">PARADISO</span>
              <span className="vinyl-hole"></span>
              <span className="vinyl-speed">33⅓ RPM</span>
            </div>
          </div>
        </div>

        {/* Album Jacket / Sleeve Frame */}
        <div className="record-jacket-cover">
          {r.image ? (
            <img src={r.image} alt={r.title || 'Album Art'} className="jacket-artwork" loading="lazy" />
          ) : (
            <div className="default-jacket-artwork">
              <span className="cassette-tape-icon">📼</span>
              <span className="jacket-label-text">SIDE A</span>
            </div>
          )}

          <div className="jacket-header-strip">
            <span className="jacket-genre-badge">{genre.toUpperCase()}</span>
            {year && <span className="jacket-year-badge">{year}</span>}
          </div>

          <button
            type="button"
            className="spin-toggle-btn"
            onClick={toggleSpin}
            aria-label={isPlaying ? 'Pause vinyl spin' : 'Spin vinyl'}
          >
            {isPlaying ? '⏸ PAUSE DISC' : '▶ SPIN VINYL'}
          </button>
        </div>
      </div>

      {/* Track & Review Info */}
      <div className="music-info-pane">
        <div className="music-title-header">
          <h3 className="music-album-title">{r.title || 'Untitled Track'}</h3>
          <p className="music-artist-name">by <b>{artist}</b></p>
        </div>

        {favTrack && (
          <div className="fav-track-badge">
            <span className="fav-star">★</span> <b>Standout Track:</b> {favTrack}
          </div>
        )}

        {r.body && (
          <div className={`music-review-notes ${expanded ? 'expanded' : 'collapsed'}`}>
            <div className="md" dangerouslySetInnerHTML={md(r.body)} />
          </div>
        )}

        {r.body && r.body.length > 200 && (
          <button
            type="button"
            className="music-expand-btn"
            onClick={() => {
              playCassetteClick();
              setExpanded(!expanded);
            }}
          >
            {expanded ? '▲ Hide Liner Notes' : '▼ Read Liner Notes & Impressions'}
          </button>
        )}

        {dateStr && <div className="music-log-date">Archived on {dateStr}</div>}
      </div>

      {admin && (
        <div className="card-admin-bar">
          <button onClick={() => onEdit?.(r)} title="Edit music entry">
            ✎ Edit
          </button>
          <button onClick={handleDelete} className="del" title="Delete music entry">
            ✕ Delete
          </button>
        </div>
      )}
    </article>
  );
}
