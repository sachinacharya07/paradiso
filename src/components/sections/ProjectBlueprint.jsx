import { db } from '../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { md } from '../../constants';
import { useToast } from '../Toast';

/**
 * Blueprint / Workbench Component for Work & Projects (⚙)
 * Technical schematic layout, live demo links, tech stack badges, and screenshots.
 */
export default function ProjectBlueprint({ r, admin = false, onEdit, reload, index = 0 }) {
  const toast = useToast();

  // If extra contains links or tech stack e.g. "React · Node · https://..."
  const extraStr = r.extra || '';
  let linkUrl = '';
  const tags = [];

  extraStr.split('·').forEach(item => {
    const trimmed = item.trim();
    if (trimmed.startsWith('http')) {
      linkUrl = trimmed;
    } else if (trimmed) {
      tags.push(trimmed);
    }
  });

  const handleDelete = async () => {
    if (!window.confirm(`Delete project "${r.title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'entries', r.id));
      toast('Project deleted', 'success');
      reload();
    } catch (err) {
      toast('Failed to delete: ' + err.message, 'error');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}#project`;
    navigator.clipboard.writeText(url).then(
      () => toast('Link copied', 'success'),
      () => toast('Failed to copy', 'error')
    );
  };

  return (
    <article
      className="project-blueprint card-enter"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="blueprint-grid-header">
        <span className="blueprint-tag">SYSTEM // 0{index + 1}</span>
        <span className="blueprint-status">ACTIVE SPEC</span>
      </div>

      {r.image && (
        <div className="blueprint-preview">
          <img src={r.image} alt={r.title || 'Project screenshot'} loading="lazy" />
        </div>
      )}

      <div className="blueprint-info">
        <h3 className="blueprint-title">{r.title || 'Untitled Project'}</h3>

        {tags.length > 0 && (
          <div className="blueprint-tags">
            {tags.map((tag, i) => (
              <span key={i} className="blueprint-tech-pill">
                {tag}
              </span>
            ))}
          </div>
        )}

        {r.body && (
          <div className="blueprint-desc md" dangerouslySetInnerHTML={md(r.body)} />
        )}

        <div className="blueprint-actions-row">
          {linkUrl && (
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="blueprint-btn-demo"
            >
              LAUNCH PROJECT ↗
            </a>
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
        </div>
      </div>
    </article>
  );
}
