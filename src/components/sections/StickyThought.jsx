import { db } from '../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { md, formatDate } from '../../constants';
import { useToast } from '../Toast';

/**
 * Pastel Sticky Note Component for Thoughts (☁)
 * Corkboard pastel-tinted cards with a pushpin 📌, subtle drop shadow,
 * slight organic rotation, and timestamp.
 */
export default function StickyThought({ r, admin = false, onEdit, reload, index = 0 }) {
  const toast = useToast();
  const dateStr = formatDate(r.date);

  // Palette of subtle pastel tints based on index
  const tints = ['sticky-cream', 'sticky-rose', 'sticky-sage', 'sticky-sky'];
  const tintClass = tints[index % tints.length];
  // Slight alternating tilt
  const tilts = [-1.2, 0.8, -0.6, 1.4, -0.9, 0.5];
  const tiltDeg = tilts[index % tilts.length];

  const handleDelete = async () => {
    if (!window.confirm('Delete this thought?')) return;
    try {
      await deleteDoc(doc(db, 'entries', r.id));
      toast('Thought deleted', 'success');
      reload();
    } catch (err) {
      toast('Failed to delete: ' + err.message, 'error');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}#thought`;
    navigator.clipboard.writeText(url).then(
      () => toast('Link copied', 'success'),
      () => toast('Failed to copy', 'error')
    );
  };

  return (
    <article
      className={`sticky-thought ${tintClass} card-enter`}
      style={{
        transform: `rotate(${tiltDeg}deg)`,
        animationDelay: `${index * 0.06}s`,
      }}
    >
      {/* Pushpin */}
      <div className="sticky-pin" aria-hidden="true">
        📌
      </div>

      {r.title && <h3 className="sticky-title">{r.title}</h3>}

      <div className="sticky-body md" dangerouslySetInnerHTML={md(r.body)} />

      {r.image && (
        <div className="sticky-image">
          <img src={r.image} alt={r.title || 'Thought attachment'} loading="lazy" />
        </div>
      )}

      <div className="sticky-footer">
        <span className="sticky-time">{dateStr}</span>
        <div className="card-actions sticky-actions">
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
