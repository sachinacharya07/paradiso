import { db } from '../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { md, formatDate } from '../../constants';
import { useToast } from '../Toast';

/**
 * Typewriter Notebook Component for Poems (❀)
 * Left-aligned classic typewriter aesthetic with faint lined-paper styling,
 * margin date stamp, and relaxed stanza spacing.
 */
export default function PoemNote({ r, admin = false, onEdit, reload, index = 0 }) {
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

        {/* Lined body with typewriter verses */}
        <div className="poem-body-wrap">
          <h3 className="poem-title">{r.title || 'untitled'}</h3>
          {r.extra && <div className="poem-epigraph">― {r.extra}</div>}

          {r.image && (
            <div className="poem-image-wrap">
              <img src={r.image} alt={r.title || 'Poem illustration'} loading="lazy" />
            </div>
          )}

          <div className="poem-verses md" dangerouslySetInnerHTML={md(r.body)} />

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
