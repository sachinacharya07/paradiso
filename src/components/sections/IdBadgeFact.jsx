import { db } from '../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { md } from '../../constants';
import { useToast } from '../Toast';

/**
 * Retro ID Badge / Passport Trivia Card Component for About Me (☺)
 * Numbered passport cards with official ink stamps and punchy facts.
 */
export default function IdBadgeFact({ r, admin = false, onEdit, reload, index = 0 }) {
  const toast = useToast();

  const handleDelete = async () => {
    if (!window.confirm('Delete this fact?')) return;
    try {
      await deleteDoc(doc(db, 'entries', r.id));
      toast('Fact deleted', 'success');
      reload();
    } catch (err) {
      toast('Failed to delete: ' + err.message, 'error');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}#fact`;
    navigator.clipboard.writeText(url).then(
      () => toast('Link copied', 'success'),
      () => toast('Failed to copy', 'error')
    );
  };

  return (
    <article
      className="id-badge-card card-enter"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="id-badge-top">
        <div className="id-badge-chip">
          <span className="id-num">NO. {String(index + 1).padStart(2, '0')}</span>
          <span className="id-class">IDENTITY DOSSIER</span>
        </div>
        <span className="id-stamp-circle">VERIFIED ☺</span>
      </div>

      <div className="id-badge-body">
        {r.image && (
          <div className="id-badge-photo">
            <img src={r.image} alt={r.title || 'Fact photo'} loading="lazy" />
          </div>
        )}

        <div className="id-badge-text">
          <h3 className="id-badge-title">{r.title || 'Trivia'}</h3>
          {r.body && (
            <div className="id-badge-desc md" dangerouslySetInnerHTML={md(r.body)} />
          )}
        </div>
      </div>

      <div className="id-badge-footer">
        <span className="id-barcode">||| | |||| | |||||</span>
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
    </article>
  );
}
