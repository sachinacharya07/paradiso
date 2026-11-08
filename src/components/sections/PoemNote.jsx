import { useState } from 'react';
import { db } from '../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { md, formatDate } from '../../constants';
import { useToast } from '../Toast';
import { playBeep } from '../../utils/sound';

/**
 * Typewriter Notebook Component for Poems (❀)
 * Left-aligned classic typewriter aesthetic with faint lined-paper styling,
 * margin date stamp, and Font Switcher [Aa Typewriter | Aa Serif].
 */
export default function PoemNote({ r, admin = false, onEdit, reload, index = 0 }) {
  const [fontMode, setFontMode] = useState('typewriter'); // 'typewriter' or 'serif'
  const toast = useToast();
  const dateStr = formatDate(r.date);

  const handleDelete = async () => {
    if (!window.confirm(`Delete poem "${r.title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'entries', r.id));
      toast('Poem deleted', 'success');
      reload();
    } catch (err) {
      toast('Failed to delete: ' + err.message, 'error');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}#poem`;
    navigator.clipboard.writeText(url).then(
      () => toast('Link copied', 'success'),
      () => toast('Failed to copy', 'error')
    );
  };

  const toggleFont = () => {
    playBeep();
    setFontMode((prev) => (prev === 'typewriter' ? 'serif' : 'typewriter'));
  };

  return (
    <article
      className="poem-note card-enter"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="poem-paper">
        {/* Margin with red vertical rule & typewriter date */}
        <aside className="poem-margin">
          <span className="poem-glyph">❀</span>
          <span className="poem-date-stamp">{dateStr}</span>
        </aside>

        {/* Lined body with typewriter/serif verses */}
        <div className="poem-body-wrap">
          <div className="poem-header-row">
            <h3 className="poem-title">{r.title || 'untitled'}</h3>
            <button
              className="poem-font-toggle"
              onClick={toggleFont}
              title="Toggle font: Typewriter vs Classic Serif"
            >
              {fontMode === 'typewriter' ? 'Aa Serif' : 'Aa Typewriter'}
            </button>
          </div>

          {r.extra && <div className="poem-epigraph">― {r.extra}</div>}

          {r.image && (
            <div className="poem-image-wrap">
              <img src={r.image} alt={r.title || 'Poem illustration'} loading="lazy" />
            </div>
          )}

          <div
            className={`poem-verses md ${fontMode === 'serif' ? 'font-serif' : 'font-typewriter'}`}
            dangerouslySetInnerHTML={md(r.body)}
          />

          <div className="card-actions poem-actions">
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
      </div>
    </article>
  );
}
