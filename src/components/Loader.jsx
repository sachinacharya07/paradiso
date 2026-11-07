/**
 * Loading skeleton placeholders for content areas.
 */
export default function Loader({ count = 3 }) {
  return (
    <div className="loader-skeletons" aria-busy="true" aria-label="Loading content">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.12}s` }}>
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-meta" />
          <div className="skeleton-line skeleton-body" />
          <div className="skeleton-line skeleton-body short" />
        </div>
      ))}
    </div>
  );
}
