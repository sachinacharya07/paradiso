import { useState } from 'react';
import { db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { NAME, SHORT, md, formatDate, readingTime } from '../constants';
import { useToast } from './Toast';

/**
 * Card component for displaying an individual entry.
 * Shows title, date, extra info, body (markdown), and admin controls.
 */
export default function Card({ r, admin = false, onEdit, reload, open, index = 0 }) {
  const [expanded, setExpanded] = useState(open || SHORT.includes(r.type));
  const toast = useToast();

  const dateStr = formatDate(r.date);
  const rTime = readingTime(r.body);
  const showReadingTime = rTime > 1 && !SHORT.includes(r.type);

  const handleDelete = async () => {
    if (!window.confirm('Delete this entry?')) return;
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
      () => toast('Link copied to clipboard', 'success'),
      () => toast('Failed to copy link', 'error')
    );
  };

  return (
    <article
      className={`card card-enter`}
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <h3 onClick={() => setExpanded(!expanded)}>
        {expanded ? '▾' : '▸'} {r.title || 'untitled'}
      </h3>
      <small>
        {NAME[r.type]}
        {dateStr && ` · ${dateStr}`}
        {r.extra && r.type !== 'find' ? ` · ${r.extra}` : ''}
        {showReadingTime && ` · ${rTime} min read`}
      </small>

      {r.type === 'find' && r.extra && (
        <p>
          <a href={r.extra} target="_blank" rel="noreferrer">
            {r.extra}
          </a>
        </p>
      )}

      {r.image && <img src={r.image} loading="lazy" alt={r.title || ''} />}

      {expanded && (
        <div className="md" dangerouslySetInnerHTML={md(r.body)} />
      )}

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
    </article>
  );
}
