import { db } from '../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { md, formatDate } from '../../constants';
import { useToast } from '../Toast';

/**
 * Vintage Airmail Envelope & Letter Component for Letters (✉)
 * Iconic red & blue striped border, postmark circular stamp with date,
 * "TO: [title]" and "FROM: Sachin" header.
 */
export default function AirmailLetter({ r, admin = false, onEdit, reload, index = 0 }) {
  const toast = useToast();
  const dateStr = formatDate(r.date);

  const handleDelete = async () => {
    if (!window.confirm(`Delete letter "${r.title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'entries', r.id));
      toast('Letter deleted', 'success');
      reload();
    } catch (err) {
      toast('Failed to delete: ' + err.message, 'error');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}#letter`;
    navigator.clipboard.writeText(url).then(
      () => toast('Link copied', 'success'),
      () => toast('Failed to copy', 'error')
    );
  };

  return (
    <article
      className="airmail-letter card-enter"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="airmail-border">
        <div className="airmail-inner">
          {/* Header with postage stamp & postmark */}
          <div className="airmail-header">
            <div className="airmail-meta">
              <div className="airmail-to">
                <span className="airmail-tag">TO:</span> <b>{r.title || 'Someone special'}</b>
              </div>
              <div className="airmail-from">
                <span className="airmail-tag">FROM:</span> <span>Sachin · Paradiso</span>
              </div>
            </div>

            {/* Postmark stamp */}
            <div className="airmail-postmark">
              <div className="postmark-circle">
                <span className="postmark-city">PARADISO</span>
                <span className="postmark-date">{dateStr || 'AIR MAIL'}</span>
                <span className="postmark-waves">≈≈≈</span>
              </div>
              <div className="postage-stamp">
                <span>✉</span>
                <small>PAR AVION</small>
              </div>
            </div>
          </div>

          <hr className="airmail-divider" />

          {/* Letter Body */}
          <div className="airmail-body md" dangerouslySetInnerHTML={md(r.body)} />

          {r.image && (
            <div className="airmail-attachment">
              <img src={r.image} alt={r.title || 'Enclosed memory'} loading="lazy" />
            </div>
          )}

          {/* Sign-off */}
          <div className="airmail-signoff">
            <span className="airmail-pen">with love, Sachin</span>
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
          </div>
        </div>
      </div>
    </article>
  );
}
