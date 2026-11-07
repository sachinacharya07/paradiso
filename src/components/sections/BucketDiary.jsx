import { db } from '../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { md } from '../../constants';
import { useToast } from '../Toast';

/**
 * Stamped Diary Component for Bucket List (☑)
 * Clean diary checklist with date completed written in green ink
 * and strike-through text for achieved dreams.
 */
export default function BucketDiary({ r, admin = false, onEdit, reload, index = 0 }) {
  const toast = useToast();
  const isDone = !!(r.extra && r.extra.trim());

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${r.title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'entries', r.id));
      toast('Bucket item deleted', 'success');
      reload();
    } catch (err) {
      toast('Failed to delete: ' + err.message, 'error');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}#bucket`;
    navigator.clipboard.writeText(url).then(
      () => toast('Link copied', 'success'),
      () => toast('Failed to copy', 'error')
    );
  };

  return (
    <article
      className={`bucket-diary-item card-enter ${isDone ? 'is-completed' : 'is-pending'}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="bucket-bullet">
        {isDone ? (
          <span className="bullet-checked" title="Completed">✓</span>
        ) : (
          <span className="bullet-empty" title="Pending">○</span>
        )}
      </div>

      <div className="bucket-content">
        <div className="bucket-title-row">
          <h3 className="bucket-title">{r.title || 'untitled goal'}</h3>
          {isDone ? (
            <span className="bucket-stamp done-stamp">
              [ACHIEVED: {r.extra}]
            </span>
          ) : (
            <span className="bucket-stamp pending-stamp">[STILL TO DO]</span>
          )}
        </div>

        {r.body && (
          <div className="bucket-notes md" dangerouslySetInnerHTML={md(r.body)} />
        )}

        {r.image && (
          <div className="bucket-image">
            <img src={r.image} alt={r.title || 'Goal memory'} loading="lazy" />
          </div>
        )}

        <div className="card-actions bucket-actions">
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
    </article>
  );
}
