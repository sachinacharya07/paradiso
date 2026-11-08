import { useState } from 'react';
import { db } from '../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { md, formatDate } from '../../constants';
import { useToast } from '../Toast';
import { playPaperTear } from '../../utils/sound';

/**
 * Vintage Airmail Envelope & Letter Component for Letters (✉)
 * Iconic red & blue striped border, postmark circular stamp with date,
 * "TO: [recipient]" and "FROM: Sachin" header.
 */
export default function AirmailLetter({ r, admin = false, onEdit, reload, index = 0 }) {
  const [photoEnlarged, setPhotoEnlarged] = useState(false);
  const toast = useToast();
  const dateStr = formatDate(r.date);

  const handleDelete = async () => {
    if (!window.confirm(`Delete letter "${r.title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'entries', r.id));
      toast('Letter deleted', 'success');
      reload?.();
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
                <span className="airmail-tag">FROM:</span> <span>Sachin</span>
              </div>
            </div>

            {/* Postmark stamp */}
            <div className="airmail-postmark">
              <div className="postmark-circle">
                <span className="postmark-city">AIR MAIL</span>
                <span className="postmark-date">{dateStr || 'PAR AVION'}</span>
                <span className="postmark-waves">≈≈≈</span>
              </div>
              <div className="postage-stamp">
                <span>✉</span>
                <small>PAR AVION</small>
              </div>
            </div>
          </div>

          <hr className="airmail-divider" />

          {/* Letter Body & Small Polaroid Attachment */}
          <div className="airmail-content-layout">
            <div className="airmail-body md" dangerouslySetInnerHTML={md(r.body)} />

            {r.image && (
              <div className="airmail-small-photo-wrap">
                <div
                  className="airmail-small-photo"
                  onClick={() => {
                    playPaperTear();
                    setPhotoEnlarged(true);
                  }}
                  title="Click to expand photo"
                >
                  <span className="airmail-paperclip">📎</span>
                  <img src={r.image} alt={r.title || 'Enclosed snapshot'} loading="lazy" />
                  <span className="photo-caption">ENCLOSED ↗</span>
                </div>
              </div>
            )}
          </div>

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

      {/* Lightbox modal when small photo is clicked */}
      {photoEnlarged && (
        <div className="modal" onClick={() => setPhotoEnlarged(false)}>
          <div className="win modal-win airmail-photo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bar">
              <span>Enclosed Photo · Letter to {r.title || 'Friend'}</span>
              <a href="#" onClick={(e) => { e.preventDefault(); setPhotoEnlarged(false); }}>✕</a>
            </div>
            <div className="body" style={{ textAlign: 'center', padding: '16px' }}>
              <img
                src={r.image}
                alt={r.title || 'Enclosed memory'}
                style={{ maxWidth: '100%', maxHeight: '70vh', border: '2px solid var(--ink)' }}
              />
              <p style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
                Enclosed with letter from Sachin · {dateStr}
              </p>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
