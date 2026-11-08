import { useState } from 'react';
import { db } from '../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { md, formatDate } from '../../constants';
import { useToast } from '../Toast';
import { playBeep } from '../../utils/sound';

/**
 * Parse game metadata from extra (e.g. "SNES · 9.5/10 · Beaten · 1994")
 */
export function parseGameMeta(extra) {
  if (!extra) {
    return { platform: 'Arcade', score: '9/10', status: 'Beaten', year: '' };
  }

  const parts = String(extra).split('·').map(p => p.trim());
  let platform = '';
  let score = '';
  let status = '';
  let year = '';

  parts.forEach(p => {
    if (/\b(19\d\d|20\d\d)\b/.test(p) && !year) {
      year = p.match(/\b(19\d\d|20\d\d)\b/)[1];
    } else if (/(\d+(?:\.\d+)?)\s*\/\s*(\d+)/.test(p) || /[★☆]+/.test(p)) {
      score = p;
    } else if (/(beaten|playing|backlog|completed|wishlist)/i.test(p)) {
      status = p;
    } else if (!platform) {
      platform = p;
    }
  });

  return {
    platform: platform || 'Retro',
    score: score || '9/10',
    status: status || 'Beaten',
    year,
  };
}

/**
 * Retro Game Cartridge Component for Games (🎮)
 */
export default function GameCartridge({ r, admin = false, onEdit, reload, index = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const toast = useToast();
  const dateStr = formatDate(r.date);
  const { platform, score, status, year } = parseGameMeta(r.extra);

  const handleDelete = async () => {
    if (!window.confirm(`Delete game entry "${r.title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'entries', r.id));
      toast('Game removed from arcade', 'success');
      reload?.();
    } catch (err) {
      toast('Failed to delete: ' + err.message, 'error');
    }
  };

  const isBeaten = /beaten|completed/i.test(status);
  const isPlaying = /playing/i.test(status);

  return (
    <article
      className="retro-game-cartridge slide-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Top cartridge grip notch */}
      <div className="cartridge-top-ridge">
        <div className="cartridge-notch notch-1"></div>
        <div className="cartridge-notch notch-2"></div>
        <div className="cartridge-notch notch-3"></div>
      </div>

      {/* Cartridge Main Shell */}
      <div className="cartridge-shell">
        {/* Label Sticker */}
        <div className="cartridge-sticker">
          <div className="cartridge-banner">
            <span className="cartridge-platform">{platform.toUpperCase()}</span>
            <span className={`cartridge-status-pill ${isBeaten ? 'status-beaten' : isPlaying ? 'status-playing' : 'status-backlog'}`}>
              {isBeaten ? '★ BEATEN' : isPlaying ? '🕹 PLAYING' : '⏳ BACKLOG'}
            </span>
          </div>

          <div className="cartridge-art-row">
            {r.image ? (
              <img src={r.image} alt={r.title || 'Game Boxart'} className="cartridge-art" loading="lazy" />
            ) : (
              <div className="default-cartridge-art">
                <span className="arcade-pixel-icon">👾</span>
              </div>
            )}

            <div className="cartridge-title-box">
              <h3 className="cartridge-title">{r.title || 'Untitled Game'}</h3>
              {year && <span className="cartridge-year">Release: {year}</span>}

              <div className="cartridge-score-tag">
                <span className="score-label">RATING:</span>
                <span className="score-val">{score}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Review & Memories */}
        {r.body && (
          <div className="cartridge-notes-pane">
            <div className={`cartridge-body ${expanded ? 'expanded' : 'collapsed'}`}>
              <div className="md" dangerouslySetInnerHTML={md(r.body)} />
            </div>

            {r.body.length > 200 && (
              <button
                type="button"
                className="cartridge-expand-btn"
                onClick={() => {
                  playBeep();
                  setExpanded(!expanded);
                }}
              >
                {expanded ? '▲ Hide Playthrough Review' : '▼ Read Playthrough Review'}
              </button>
            )}
          </div>
        )}

        <div className="cartridge-footer-seal">
          <span>PARADISO ENTERTAINMENT SYSTEM</span>
          {dateStr && <span>LOGGED {dateStr}</span>}
        </div>
      </div>

      {admin && (
        <div className="card-admin-bar">
          <button onClick={() => onEdit?.(r)} title="Edit game entry">
            ✎ Edit
          </button>
          <button onClick={handleDelete} className="del" title="Delete game entry">
            ✕ Delete
          </button>
        </div>
      )}
    </article>
  );
}
