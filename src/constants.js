import { marked } from 'marked';

/**
 * Section definitions: [key, label, icon]
 */
export const SEC = [
  ['post', 'Updates', '✎'],
  ['review', 'Movies', '▶'],
  ['poem', 'Poems', '❀'],
  ['essay', 'Essays', '¶'],
  ['creative', 'Creative', '✦'],
  ['project', 'Work', '⚙'],
  ['interest', 'Interests', '♥'],
  ['thought', 'Thoughts', '☁'],
  ['quote', 'Quotes', '❝'],
  ['find', 'Finds', '⌕'],
  ['letter', 'Letters', '✉'],
  ['bucket', 'Bucket List', '☑'],
  ['timeline', 'Timeline', '◷'],
  ['scrap', 'Scrapbook', '▣'],
  ['fact', 'About Me', '☺'],
];

/**
 * Extra field placeholder text per section type.
 */
export const EXTRA = {
  review: 'Your Rating & Year (e.g. 4.5/5 · 2024 or 9/10)',
  bucket: 'Date done (blank = not yet)',
  timeline: 'Date',
  find: 'Link URL',
};

/**
 * Section types that should show their body content expanded by default.
 */
export const SHORT = [
  'poem', 'thought', 'quote', 'fact', 'bucket', 'timeline', 'letter',
];

/**
 * Map of section key → display name.
 */
export const NAME = Object.fromEntries(SEC.map(s => [s[0], s[1]]));

/**
 * Set of all valid hash sections (for unknown route handling).
 */
export const VALID_SECTIONS = new Set(
  SEC.map(s => s[0]).concat(['archive', 'guest', 'admin'])
);

/**
 * Icons for "Now" section status types.
 */
export const NOW_ICONS = {
  listening: '🎧',
  watching: '📺',
  reading: '📖',
  thought: '💭',
};

/**
 * Average words per minute for reading time estimation.
 */
export const WPM = 200;

export function readingTime(text) {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / WPM));
}

let ctx;
export function beep() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 520;
    g.gain.value = 0.03;
    o.connect(g);
    g.connect(ctx.destination);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
    o.start();
    o.stop(ctx.currentTime + 0.05);
  } catch {
    // audio not available
  }
}

/**
 * Configure marked with:
 * - HTML escaping (XSS prevention)
 * - Rich media auto-embeds for YouTube videos and Spotify tracks/albums
 */
marked.use({
  renderer: {
    html(token) {
      const raw = typeof token === 'object' && token.raw ? token.raw : String(token);
      return raw.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },
    link(arg1, titleArg, textArg) {
      const href = typeof arg1 === 'object' ? arg1.href : arg1;
      const title = typeof arg1 === 'object' ? arg1.title : titleArg;
      const text = typeof arg1 === 'object' ? arg1.text : textArg;

      if (!href) return text || '';

      // Auto-embed YouTube
      const ytMatch = href.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (ytMatch && (text === href || !text)) {
        return `<div class="retro-media-embed youtube-embed"><iframe src="https://www.youtube-nocookie.com/embed/${ytMatch[1]}" frameborder="0" allowfullscreen loading="lazy" title="YouTube video"></iframe></div>`;
      }

      // Auto-embed Spotify
      const spMatch = href.match(/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
      if (spMatch && (text === href || !text)) {
        return `<div class="retro-media-embed spotify-embed"><iframe src="https://open.spotify.com/embed/${spMatch[1]}/${spMatch[2]}" width="100%" height="152" frameborder="0" allow="encrypted-media" loading="lazy" title="Spotify audio"></iframe></div>`;
      }

      return `<a href="${href}"${title ? ` title="${title}"` : ''} target="_blank" rel="noopener noreferrer">${text}</a>`;
    },
  },
});

export function md(t) {
  return { __html: marked.parse(t || '') };
}

export function formatDate(date) {
  if (!date) return '';
  try {
    if (typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString();
    }
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    if (typeof date === 'string' || typeof date === 'number') {
      return new Date(date).toLocaleDateString();
    }
  } catch {
    // fall through
  }
  return '';
}

export const PAGE_SIZE = 20;
