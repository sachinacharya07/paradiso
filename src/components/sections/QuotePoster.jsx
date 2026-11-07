import { db } from '../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { md } from '../../constants';
import { useToast } from '../Toast';

/**
 * Bold Typographic Poster Component for Quotes (❝)
 * Giant quotation marks “ ”, high-contrast typography, and author/source attribution.
 */
export default function QuotePoster({ r, admin = false, onEdit, reload, index = 0 }) {
  const toast = useToast();

  const handleDelete = async () => {
    if (!window.confirm('Delete this quote?')) return;
    try {
      await deleteDoc(doc(db, 'entries', r.id));
      toast('Quote deleted', 'success');
      reload();
    } catch (err) {
      toast('Failed to delete: ' + err.message, 'error');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}#quote`;
    navigator.clipboard.writeText(url).then(
      () => toast('Link copied', 'success'),
      () => toast('Failed to copy', 'error')
    );
  };

  return (
    <article
      className="quote-poster card-enter"
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      <div className="quote-mark-watermark" aria-hidden="true">
        “
      </div>

      <div className="quote-content">
        <blockquote className="quote-text md" dangerouslySetInnerHTML={md(r.body || r.title)} />

        <div className="quote-attribution">
          <span className="quote-dash">―</span>
          <cite className="quote-author">
            {r.title && r.body ? r.title : r.extra || 'Anonymous'}
          </cite>
          {r.extra && r.title && r.body && (
            <span className="quote-source">({r.extra})</span>
          )}
        </div>

        {r.image && (
          <div className="quote-image">
            <img src={r.image} alt="Quote inspiration" loading="lazy" />
          </div>
        )}

        <div className="card-actions quote-actions">
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
