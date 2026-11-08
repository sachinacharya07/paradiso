/**
 * Retro Pixel / Vector Section Icon Component
 * Replaces modern OS colorful emojis (📚, 🎧, 🎮) with authentic
 * monochrome retro 90s vector glyphs matching the vaporwave OS aesthetic.
 */
export default function SectionIcon({ type, fallback, size = 26, className = '' }) {
  if (type === 'book') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`retro-icon retro-icon-book ${className}`}
        aria-hidden="true"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        <line x1="6" y1="8" x2="8" y2="8" />
        <line x1="6" y1="12" x2="8" y2="12" />
        <line x1="16" y1="8" x2="18" y2="8" />
        <line x1="16" y1="12" x2="18" y2="12" />
      </svg>
    );
  }

  if (type === 'music') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`retro-icon retro-icon-cassette ${className}`}
        aria-hidden="true"
      >
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <circle cx="8" cy="12" r="2.5" />
        <circle cx="16" cy="12" r="2.5" />
        <path d="M8 9.5h8" />
        <path d="M8 14.5h8" />
        <line x1="2" y1="8" x2="22" y2="8" />
      </svg>
    );
  }

  if (type === 'game') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`retro-icon retro-icon-arcade ${className}`}
        aria-hidden="true"
      >
        <rect x="2" y="6" width="20" height="12" rx="3" />
        <path d="M6 12h4" />
        <path d="M8 10v4" />
        <circle cx="15" cy="13" r="1.3" fill="currentColor" />
        <circle cx="18" cy="11" r="1.3" fill="currentColor" />
      </svg>
    );
  }

  return <span className={className}>{fallback}</span>;
}
