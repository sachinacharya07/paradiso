import { db } from '../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { md, formatDate } from '../../constants';
import { useToast } from '../Toast';

/**
 * Retro Rolodex / Bookmark Card Component for Finds (⌕)
 * Shows domain pill, clean bookmark tab, description, and direct "VISIT ↗" button.
 */
export default function RolodexFind({ r, admin = false, onEdit, reload, index = 0 }) {
  const toast = useToast();
  const dateStr = formatDate(r.date);
  const linkUrl = r.extra || '';

  // Extract clean hostname for domain pill
  let domain = '';
  try {
    if (linkUrl) {
      domain = new URL(linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`).hostname.replace('www.', '');
    }
  } catch {
    domain = linkUrl;
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete find "${r.title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'entries', r.id));
      toast('Bookmark deleted', 'success');
      reload();
    } catch (err) {
      toast('Failed to delete: ' + err.message, 'error');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}#find`;
    navigator.clipboard.writeText(url).then(
      () => toast('Link copied', 'success'),
      () => toast('Failed to copy', 'error')
    );
  };

  return (
    <article
      className="rolodex-card card-enter"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className="rolodex-tab">
        <span className="rolodex-index">CARD #{String(index + 1).padStart(3, '0')}</span>
        {domain && <span className="rolodex-domain-pill">{domain}</span>}
      </div>

      <div className="rolodex-body">
        <div className="rolodex-header-row">
          <h3 className="rolodex-title">
            {linkUrl ? (
              <a href={linkUrl} target="_blank" rel="noopener noreferrer">
                {r.title || domain || 'Untitled Find'} ↗
              </a>
            ) : (
              r.title || 'Untitled Find'
            )}
          </h3>

          {linkUrl && (
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rolodex-visit-btn"
            >
              VISIT ↗
            </a>
          )}
        </div>

        {r.body && (
          <div className="rolodex-notes md" dangerouslySetInnerHTML={md(r.body)} />
        )}

        {r.image && (
          <div className="rolodex-image">
            <img src={r.image} alt={r.title || 'Preview'} loading="lazy" />
          </div>
        )}

        <div className="rolodex-footer">
          <small className="rolodex-date">ARCHIVED: {dateStr}</small>
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
    </article>
  );
}
