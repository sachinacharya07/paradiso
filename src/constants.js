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
  review: 'Rating & year (e.g. 4/5 · 2019)',
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

/**
 * Estimate reading time in minutes.
 */
export function readingTime(text) {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / WPM));
}

/**
 * Play a short beep using the Web Audio API.
 * Cleans up oscillator nodes after they stop.
 */
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
 * Configure marked to escape raw HTML (XSS prevention).
 */
import { marked } from 'marked';

marked.use({
  renderer: {
    html(token) {
      return token.raw.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },
  },
});

/**
 * Render markdown string to a React dangerouslySetInnerHTML object.
 * HTML in markdown is escaped to prevent XSS.
 */
export function md(t) {
  return { __html: marked.parse(t || '') };
}

/**
 * Format a Firestore timestamp-like value safely.
 * Wraps in try/catch to prevent crashes on non-Timestamp values (BUG FIX #2).
 */
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

/**
 * Page size for paginated queries.
 */
export const PAGE_SIZE = 20;
