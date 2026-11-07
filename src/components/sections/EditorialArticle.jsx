import { useState } from 'react';
import { db } from '../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { NAME, md, formatDate, readingTime } from '../../constants';
import { useToast } from '../Toast';

/**
 * Editorial Article Component for Essays (¶), Updates (✎), Creative (✦), & Interests (♥)
 * Clean magazine layout with reading time estimates, drop caps, and comfortable spacing.
 */
export default function EditorialArticle({ r, admin = false, onEdit, reload, index = 0 }) {
  const [expanded, setExpanded] = useState(r.type !== 'essay');
  const toast = useToast();
  const dateStr = formatDate(r.date);
  const rTime = readingTime(r.body);

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${r.title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'entries', r.id));
      toast('Entry deleted', 'success');
      reload();
    } catch (err) {
      toast('Failed to delete: ' + err.message, 'error');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}#${r.type}`;
    navigator.clipboard.writeText(url).then(
      () => toast('Link copied', 'success'),
      () => toast('Failed to copy', 'error')
    );
  };

  return (
    <article
      className="editorial-article card-enter"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <header className="editorial-header">
        <div className="editorial-meta-row">
          <span className="editorial-category">{NAME[r.type] || r.type}</span>
          <span className="editorial-divider">·</span>
          <time className="editorial-date">{dateStr}</time>
          {rTime > 1 && (
            <>
              <span className="editorial-divider">·</span>
              <span className="editorial-readtime">{rTime} MIN READ</span>
            </>
          )}
          {r.extra && (
            <>
              <span className="editorial-divider">·</span>
              <span className="editorial-extra">{r.extra}</span>
            </>
          )}
        </div>

        <h3
          className="editorial-title"
          onClick={() => r.type === 'essay' && setExpanded(!expanded)}
        >
          {r.title || 'Untitled'}
        </h3>
      </header>

      {r.image && (
        <div className="editorial-hero">
          <img src={r.image} alt={r.title || 'Cover image'} loading="lazy" />
        </div>
      )}

      {expanded ? (
        <div className="editorial-body md" dangerouslySetInnerHTML={md(r.body)} />
      ) : (
        <div className="editorial-preview">
          <p>{r.body ? r.body.slice(0, 180) + '…' : ''}</p>
          <button className="editorial-read-btn" onClick={() => setExpanded(true)}>
            CONTINUE READING ➔
          </button>
        </div>
      )}

      <footer className="editorial-footer">
        <div className="card-actions">
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
      </footer>
    </article>
  );
}
