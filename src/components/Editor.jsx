import { useState, useEffect, useMemo } from 'react';
import { db, CLOUD, PRESET } from '../firebase';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { SEC, readingTime } from '../constants';
import { useToast } from './Toast';
import { playFloppySave, playTypewriterClick, playBeep, playPaperTear, playCassetteClick } from '../utils/sound';
import { ThematicCard } from './PostList';
import SectionIcon from './SectionIcon';

const DRAFT_KEY = 'paradiso-editor-draft';

function loadDraft() {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return null;
}

function saveDraft(data) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

/**
 * Section Theme Metadata for the Writer Studio
 */
const SECTION_THEMES = {
  review: {
    banner: '🎬 CINEMA STUDIO · PRODUCTION DESK',
    desc: 'Craft a film review, ticket stub score, and cinematic thoughts.',
    titlePlaceholder: 'Movie Title (e.g. Blade Runner 2049, Past Lives, Chungking Express)',
    bodyPlaceholder: 'Write your film critique... What lingered with you? The cinematography, sound design, dialogue, or themes?',
    accent: 'var(--neon-rose)',
  },
  book: {
    banner: '📚 LIBRARY DESK · CARD CATALOG',
    desc: 'Record a book review, reading status, favorite quotes, and star rating.',
    titlePlaceholder: 'Book Title (e.g. Norwegian Wood, Dune, Exhalation)',
    bodyPlaceholder: 'Write your reader reflections, favorite excerpts, and notes on the book...',
    accent: '#b4845c',
  },
  music: {
    banner: '🎧 VINYL CRATE & MIXTAPE STUDIO',
    desc: 'Curate a mixtape, album review, favorite tracks, and genre notes.',
    titlePlaceholder: 'Album or Track Title (e.g. For You, Random Access Memories)',
    bodyPlaceholder: 'Liner notes, mood, sonic impressions, and why this record matters...',
    accent: '#4a82a0',
  },
  game: {
    banner: '🎮 RETRO ARCADE · CARTRIDGE RACK',
    desc: 'Document a retro game playthrough, rating, platform, and beaten status.',
    titlePlaceholder: 'Game Title (e.g. Chrono Trigger, Super Metroid, Castlevania SOTN)',
    bodyPlaceholder: 'Playthrough review, memories, difficulty, art style, and music...',
    accent: '#00aa55',
  },
  poem: {
    banner: '❀ TYPEWRITER NOTEBOOK · STANZA DESK',
    desc: 'Compose a poem on lined parchment with mechanical typewriter keystrokes.',
    titlePlaceholder: 'Poem Title (or untitled)',
    bodyPlaceholder: 'Type your verses...\n\nStanzas breathe with line breaks.\nListen to the keys click as you compose.',
    accent: 'var(--rose)',
  },
  bucket: {
    banner: '☑ LIFE LEDGER · GOAL TRACKER',
    desc: 'Record a dream, life ambition, or stamp an achieved milestone.',
    titlePlaceholder: 'What is your goal / dream?',
    bodyPlaceholder: 'The story behind this goal... Why does it matter? What did it take to achieve?',
    accent: 'var(--sage)',
  },
  thought: {
    banner: '☁ PASTEL STICKY NOTE · CORKBOARD PAD',
    desc: 'Pin a fleeting observation, shower thought, or micro-reflection.',
    titlePlaceholder: 'Subject (optional)',
    bodyPlaceholder: 'What is on your mind right now? Short, spontaneous, unfiltered...',
    accent: 'var(--sky)',
  },
  letter: {
    banner: '✉ VINTAGE AIRMAIL · STATIONERY DESK',
    desc: 'Draft an airmail letter to someone special, your future self, or the world.',
    titlePlaceholder: 'To (Recipient: e.g. Future Me, A Dear Friend)',
    bodyPlaceholder: 'Dear reader,\n\nWrite freely from the heart...',
    accent: '#d9534f',
  },
  find: {
    banner: '⌕ ROLODEX INDEX · DISCOVERY LOG',
    desc: 'Archive an extraordinary website, tool, song, or hidden web treasure.',
    titlePlaceholder: 'Resource / Discovery Title',
    bodyPlaceholder: 'Why is this link worth saving? What makes it cool or useful?',
    accent: 'var(--sage)',
  },
  timeline: {
    banner: '◷ METRO TRANSIT · STATION ARCHITECT',
    desc: 'Add a milestone stop along your personal life journey.',
    titlePlaceholder: 'Milestone / Station Name (e.g. Graduated, Moved to NYC)',
    bodyPlaceholder: 'What happened at this station of your journey? Memories, photos, reflections...',
    accent: 'var(--neon-sky)',
  },
  quote: {
    banner: '❝ TYPOGRAPHIC POSTER · QUOTE TYPESETTER',
    desc: 'Preserve dialogue, literary lines, or unforgettable overheard words.',
    titlePlaceholder: 'Who said it? (Author / Speaker)',
    bodyPlaceholder: '“Type the exact quotation here...”',
    accent: 'var(--neon-rose)',
  },
  project: {
    banner: '⚙ WORKBENCH · SYSTEM SPECIFICATION',
    desc: 'Document a software project, creative work, or engineering build.',
    titlePlaceholder: 'Project Name (e.g. Paradiso OS, Ambient Synth)',
    bodyPlaceholder: 'Project architecture, features, inspiration, and technical highlights...',
    accent: 'var(--sky)',
  },
  fact: {
    banner: '☺ DOSSIER ARCHIVE · ABOUT ME TRIVIA',
    desc: 'Add a quirky fact or personal trivia snippet for Random Me.',
    titlePlaceholder: 'Trivia Headline (e.g. I collect vintage mechanical watches)',
    bodyPlaceholder: 'Tell the story or context behind this fact about you...',
    accent: 'var(--neon-rose)',
  },
  essay: {
    banner: '¶ EDITORIAL MAGAZINE · ESSAYIST DESK',
    desc: 'Deep longform writing, reflections, cultural analysis, or philosophies.',
    titlePlaceholder: 'Essay Title',
    bodyPlaceholder: 'Begin writing your essay in markdown...',
    accent: 'var(--ink)',
  },
  post: {
    banner: '✎ DISPATCH JOURNAL · PERSONAL UPDATES',
    desc: 'Share a dispatch from life, recent news, or general updates.',
    titlePlaceholder: 'Dispatch Title',
    bodyPlaceholder: 'What is new in your world? Write in markdown...',
    accent: 'var(--ink)',
  },
  creative: {
    banner: '✦ CREATIVE CORNER · EXPERIMENTAL ATELIER',
    desc: 'Visual artwork, photography, generative experiments, or sketches.',
    titlePlaceholder: 'Artwork / Piece Title',
    bodyPlaceholder: 'Medium, creative process, and inspiration...',
    accent: 'var(--neon-rose)',
  },
  interest: {
    banner: '♥ CABINET OF CURIOSITIES · INTERESTS',
    desc: 'A hobby, aesthetic, subject, or niche obsession you love.',
    titlePlaceholder: 'Interest Name (e.g. Cybernetics, Japanese Joinery)',
    bodyPlaceholder: 'Why do you love this? Books, inspirations, and notes...',
    accent: 'var(--rose)',
  },
};

/**
 * Bespoke Thematic Writer Studio
 * Custom form inputs, audio feedback, and live thematic preview per category.
 */
export default function Editor({ init, done }) {
  const toast = useToast();

  const [f, setF] = useState(() => {
    if (init) return { ...init, draft: !!init.draft };
    const draft = loadDraft();
    return (
      draft || {
        type: 'post',
        title: '',
        body: '',
        image: '',
        extra: '',
        draft: false,
      }
    );
  });

  // 1. Movie states
  const [movieScore, setMovieScore] = useState(() => {
    if (init?.type === 'review' && init.extra) {
      const match = String(init.extra).match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+)/);
      if (match) return `${match[1]}/${match[2]}`;
      const single = String(init.extra).match(/(\d+(?:\.\d+)?)/);
      if (single) return `${single[1]}/5`;
    }
    return '4.5/5';
  });
  const [movieYear, setMovieYear] = useState(() => {
    if (init?.type === 'review' && init.extra) {
      const match = String(init.extra).match(/\b(19\d\d|20\d\d)\b/);
      if (match) return match[1];
    }
    return new Date().getFullYear().toString();
  });
  const [movieFormat, setMovieFormat] = useState('Cinema');

  // 2. Book states
  const [bookAuthor, setBookAuthor] = useState(() => {
    if (init?.type === 'book' && init.extra) {
      return init.extra.split('·')[0]?.trim() || '';
    }
    return '';
  });
  const [bookRating, setBookRating] = useState('5/5');
  const [bookStatus, setBookStatus] = useState('Finished');
  const [bookYear, setBookYear] = useState(() => {
    if (init?.type === 'book' && init.extra) {
      const match = String(init.extra).match(/\b(19\d\d|20\d\d)\b/);
      if (match) return match[1];
    }
    return '';
  });

  // 3. Music states
  const [musicArtist, setMusicArtist] = useState(() => {
    if (init?.type === 'music' && init.extra) {
      return init.extra.split('·')[0]?.trim() || '';
    }
    return '';
  });
  const [musicGenre, setMusicGenre] = useState('City Pop');
  const [musicYear, setMusicYear] = useState(() => {
    if (init?.type === 'music' && init.extra) {
      const match = String(init.extra).match(/\b(19\d\d|20\d\d)\b/);
      if (match) return match[1];
    }
    return '1982';
  });
  const [musicFavTrack, setMusicFavTrack] = useState('');

  // 4. Game states
  const [gamePlatform, setGamePlatform] = useState('SNES');
  const [gameScore, setGameScore] = useState('9.5/10');
  const [gameStatus, setGameStatus] = useState('Beaten');
  const [gameYear, setGameYear] = useState(() => {
    if (init?.type === 'game' && init.extra) {
      const match = String(init.extra).match(/\b(19\d\d|20\d\d)\b/);
      if (match) return match[1];
    }
    return '1995';
  });

  // 5. Bucket states
  const [bucketDone, setBucketDone] = useState(() => {
    return init?.type === 'bucket' ? !!init.extra : false;
  });
  const [bucketDate, setBucketDate] = useState(() => {
    return init?.type === 'bucket' ? init.extra || '' : '';
  });

  // 6. Find & Project states
  const [linkUrl, setLinkUrl] = useState(() => {
    return init?.type === 'find' ? init.extra || '' : '';
  });
  const [projectTech, setProjectTech] = useState(() => {
    if (init?.type === 'project' && init.extra) {
      return init.extra.split('·')[0]?.trim() || '';
    }
    return '';
  });
  const [projectDemo, setProjectDemo] = useState(() => {
    if (init?.type === 'project' && init.extra) {
      const parts = init.extra.split('·');
      return parts.find((p) => p.trim().startsWith('http'))?.trim() || '';
    }
    return '';
  });

  // 7. Thought Color state
  const [thoughtColor, setThoughtColor] = useState(() => {
    return init?.type === 'thought' && init.extra ? init.extra : 'yellow';
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  const activeTheme = SECTION_THEMES[f.type] || SECTION_THEMES.post;

  // Auto-save draft
  useEffect(() => {
    if (!init) {
      saveDraft(f);
    }
  }, [f, init]);

  // Sync thematic helper states into f.extra
  useEffect(() => {
    if (f.type === 'review') {
      const extraVal = `${movieScore} · ${movieYear}${movieFormat ? ` · ${movieFormat}` : ''}`.trim();
      setF((prev) => ({ ...prev, extra: extraVal }));
    } else if (f.type === 'book') {
      const parts = [bookAuthor || 'Author', bookRating, bookStatus, bookYear].filter(Boolean);
      setF((prev) => ({ ...prev, extra: parts.join(' · ') }));
    } else if (f.type === 'music') {
      const parts = [musicArtist || 'Artist', musicGenre, musicYear, musicFavTrack].filter(Boolean);
      setF((prev) => ({ ...prev, extra: parts.join(' · ') }));
    } else if (f.type === 'game') {
      const parts = [gamePlatform, gameScore, gameStatus, gameYear].filter(Boolean);
      setF((prev) => ({ ...prev, extra: parts.join(' · ') }));
    } else if (f.type === 'bucket') {
      const extraVal = bucketDone ? (bucketDate || 'Achieved') : '';
      setF((prev) => ({ ...prev, extra: extraVal }));
    } else if (f.type === 'thought') {
      setF((prev) => ({ ...prev, extra: thoughtColor }));
    } else if (f.type === 'find') {
      setF((prev) => ({ ...prev, extra: linkUrl.trim() }));
    } else if (f.type === 'project') {
      const extraVal = [projectTech.trim(), projectDemo.trim()].filter(Boolean).join(' · ');
      setF((prev) => ({ ...prev, extra: extraVal }));
    }
  }, [
    f.type,
    movieScore,
    movieYear,
    movieFormat,
    bookAuthor,
    bookRating,
    bookStatus,
    bookYear,
    musicArtist,
    musicGenre,
    musicYear,
    musicFavTrack,
    gamePlatform,
    gameScore,
    gameStatus,
    gameYear,
    bucketDone,
    bucketDate,
    thoughtColor,
    linkUrl,
    projectTech,
    projectDemo,
  ]);

  const setField = (key) => (e) => {
    setF({ ...f, [key]: e.target.value });
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const handleBodyChange = (e) => {
    if (f.type === 'poem') {
      playTypewriterClick();
    }
    setField('body')(e);
  };

  const validate = () => {
    const newErrors = {};
    if (!f.title.trim() && f.type !== 'poem') newErrors.title = 'Title is required';
    if (!f.body.trim()) newErrors.body = 'Content is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const save = async () => {
    if (!validate()) {
      toast('Please fill in required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      playFloppySave();
      const { id, date, ...data } = f;
      const payload = {
        ...data,
        draft: !!f.draft,
      };

      if (id) {
        await updateDoc(doc(db, 'entries', id), payload);
        toast(f.draft ? 'Draft updated' : 'Entry updated', 'success');
      } else {
        await addDoc(collection(db, 'entries'), {
          ...payload,
          date: serverTimestamp(),
        });
        toast(f.draft ? 'Draft saved' : 'Entry published', 'success');
      }
      clearDraft();
      done();
    } catch (err) {
      toast('Failed to save: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', PRESET);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`,
        { method: 'POST', body: fd }
      );
      const json = await res.json();
      if (json.secure_url) {
        setF({ ...f, image: json.secure_url });
        toast('Image uploaded to Cloudinary', 'success');
      } else {
        throw new Error(json.error?.message || 'Upload failed');
      }
    } catch (err) {
      toast('Image upload failed: ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (!init) clearDraft();
    done();
  };

  // Live card preview object
  const previewEntry = useMemo(
    () => ({
      id: 'preview',
      ...f,
      date: new Date(),
    }),
    [f]
  );

  const words = (f.body || '').trim().split(/\s+/).filter(Boolean).length;
  const rTime = readingTime(f.body);

  return (
    <div className={`thematic-writer-studio theme-${f.type}`}>
      {/* Studio Header Banner */}
      <div className="writer-banner">
        <div className="writer-banner-left">
          <span className="writer-banner-title">{activeTheme.banner}</span>
          <span className="writer-banner-desc">{activeTheme.desc}</span>
        </div>

        <div className="writer-banner-right">
          <label className="editor-draft-toggle">
            <input
              type="checkbox"
              checked={!!f.draft}
              onChange={(e) => setF({ ...f, draft: e.target.checked })}
            />
            <span>{f.draft ? '🔒 DRAFT' : '🌐 PUBLIC'}</span>
          </label>
        </div>
      </div>

      {/* Category Switcher Tabs */}
      <div className="writer-category-tabs">
        {SEC.map(([k, n, icon]) => (
          <button
            key={k}
            type="button"
            className={`writer-tab-btn ${f.type === k ? 'active' : ''}`}
            onClick={() => {
              playBeep();
              setF((prev) => ({ ...prev, type: k }));
            }}
          >
            <SectionIcon type={k} fallback={icon} size={15} />
            <span>{n}</span>
          </button>
        ))}
      </div>

      {/* Main Studio Workspace: Form on Left, Live Thematic Preview on Right */}
      <div className="writer-split-workspace">
        {/* Left Side: Custom Inputs */}
        <div className="writer-form-pane">
          {/* Title Input */}
          <div className="writer-field">
            <label className="writer-field-label">
              {f.type === 'review'
                ? 'MOVIE TITLE'
                : f.type === 'book'
                  ? 'BOOK TITLE'
                  : f.type === 'music'
                    ? 'ALBUM / TRACK TITLE'
                    : f.type === 'game'
                      ? 'GAME TITLE'
                      : f.type === 'poem'
                        ? 'POEM TITLE (OR UNTITLED)'
                        : f.type === 'bucket'
                          ? 'GOAL / DREAM NAME'
                          : f.type === 'find'
                            ? 'DISCOVERY TITLE'
                            : 'TITLE'}
            </label>
            <input
              placeholder={activeTheme.titlePlaceholder}
              value={f.title}
              onChange={setField('title')}
              className={`writer-input ${errors.title ? 'input-error' : ''}`}
            />
            {errors.title && <span className="field-error">{errors.title}</span>}
          </div>

          {/* ============================================================== */}
          {/* BESPOKE THEMED INPUTS PER SECTION                              */}
          {/* ============================================================== */}

          {/* 1. MOVIES (▶) */}
          {f.type === 'review' && (
            <div className="writer-themed-fields cinema-inputs">
              <div className="writer-field-row">
                <div className="writer-field flex-1">
                  <label className="writer-field-label">YOUR RATING SCORE</label>
                  <select
                    value={movieScore}
                    onChange={(e) => setMovieScore(e.target.value)}
                    className="writer-input"
                  >
                    <option value="5/5">★★★★★ 5.0 / 5 (Masterpiece)</option>
                    <option value="4.5/5">★★★★½ 4.5 / 5 (Outstanding)</option>
                    <option value="4/5">★★★★☆ 4.0 / 5 (Great)</option>
                    <option value="3.5/5">★★★½☆ 3.5 / 5 (Very Good)</option>
                    <option value="3/5">★★★☆☆ 3.0 / 5 (Good / Decent)</option>
                    <option value="2.5/5">★★½☆☆ 2.5 / 5 (Average)</option>
                    <option value="2/5">★★☆☆☆ 2.0 / 5 (Mediocre)</option>
                    <option value="1/5">★☆☆☆☆ 1.0 / 5 (Poor)</option>
                  </select>
                </div>

                <div className="writer-field" style={{ width: '110px' }}>
                  <label className="writer-field-label">RELEASE YEAR</label>
                  <input
                    placeholder="e.g. 2024"
                    value={movieYear}
                    onChange={(e) => setMovieYear(e.target.value)}
                    className="writer-input"
                    maxLength={4}
                  />
                </div>

                <div className="writer-field" style={{ width: '130px' }}>
                  <label className="writer-field-label">FORMAT</label>
                  <input
                    placeholder="e.g. 35mm / IMAX"
                    value={movieFormat}
                    onChange={(e) => setMovieFormat(e.target.value)}
                    className="writer-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. BOOKS (📚) */}
          {f.type === 'book' && (
            <div className="writer-themed-fields book-inputs">
              <div className="writer-field-row">
                <div className="writer-field flex-1">
                  <label className="writer-field-label">AUTHOR NAME</label>
                  <input
                    placeholder="e.g. Haruki Murakami, Ted Chiang"
                    value={bookAuthor}
                    onChange={(e) => setBookAuthor(e.target.value)}
                    className="writer-input"
                  />
                </div>

                <div className="writer-field" style={{ width: '130px' }}>
                  <label className="writer-field-label">READING STATUS</label>
                  <select
                    value={bookStatus}
                    onChange={(e) => setBookStatus(e.target.value)}
                    className="writer-input"
                  >
                    <option value="Finished">✓ Finished</option>
                    <option value="Currently Reading">⏳ Reading</option>
                    <option value="Want to Read">🔖 Want to Read</option>
                  </select>
                </div>

                <div className="writer-field" style={{ width: '140px' }}>
                  <label className="writer-field-label">STAR RATING</label>
                  <select
                    value={bookRating}
                    onChange={(e) => setBookRating(e.target.value)}
                    className="writer-input"
                  >
                    <option value="5/5">★★★★★ 5/5</option>
                    <option value="4.5/5">★★★★½ 4.5/5</option>
                    <option value="4/5">★★★★☆ 4/5</option>
                    <option value="3.5/5">★★★½☆ 3.5/5</option>
                    <option value="3/5">★★★☆☆ 3/5</option>
                    <option value="2/5">★★☆☆☆ 2/5</option>
                  </select>
                </div>

                <div className="writer-field" style={{ width: '100px' }}>
                  <label className="writer-field-label">PUB YEAR</label>
                  <input
                    placeholder="e.g. 1987"
                    value={bookYear}
                    onChange={(e) => setBookYear(e.target.value)}
                    className="writer-input"
                    maxLength={4}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. MUSIC & MIXTAPES (🎧) */}
          {f.type === 'music' && (
            <div className="writer-themed-fields music-inputs">
              <div className="writer-field-row">
                <div className="writer-field flex-1">
                  <label className="writer-field-label">ARTIST / BAND</label>
                  <input
                    placeholder="e.g. Tatsuro Yamashita, Daft Punk"
                    value={musicArtist}
                    onChange={(e) => setMusicArtist(e.target.value)}
                    className="writer-input"
                  />
                </div>

                <div className="writer-field" style={{ width: '140px' }}>
                  <label className="writer-field-label">GENRE</label>
                  <select
                    value={musicGenre}
                    onChange={(e) => setMusicGenre(e.target.value)}
                    className="writer-input"
                  >
                    <option value="City Pop">City Pop</option>
                    <option value="Ambient">Ambient</option>
                    <option value="Synthwave">Synthwave</option>
                    <option value="Lo-Fi Jazz">Lo-Fi Jazz</option>
                    <option value="Soundtrack">Soundtrack</option>
                    <option value="Electronic">Electronic</option>
                    <option value="Post-Punk">Post-Punk</option>
                    <option value="Hip Hop">Hip Hop</option>
                  </select>
                </div>

                <div className="writer-field" style={{ width: '100px' }}>
                  <label className="writer-field-label">YEAR</label>
                  <input
                    placeholder="e.g. 1982"
                    value={musicYear}
                    onChange={(e) => setMusicYear(e.target.value)}
                    className="writer-input"
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="writer-field">
                <label className="writer-field-label">STANDOUT / FAVORITE TRACK</label>
                <input
                  placeholder="e.g. Sparkle, Digital Love, Resonator"
                  value={musicFavTrack}
                  onChange={(e) => setMusicFavTrack(e.target.value)}
                  className="writer-input"
                />
              </div>
            </div>
          )}

          {/* 4. GAMES & ARCADE (🎮) */}
          {f.type === 'game' && (
            <div className="writer-themed-fields game-inputs">
              <div className="writer-field-row">
                <div className="writer-field" style={{ width: '140px' }}>
                  <label className="writer-field-label">PLATFORM</label>
                  <select
                    value={gamePlatform}
                    onChange={(e) => setGamePlatform(e.target.value)}
                    className="writer-input"
                  >
                    <option value="SNES">SNES</option>
                    <option value="Game Boy">Game Boy</option>
                    <option value="PlayStation">PlayStation</option>
                    <option value="Genesis">Genesis</option>
                    <option value="N64">N64</option>
                    <option value="PC-DOS">PC-DOS</option>
                    <option value="Arcade">Arcade</option>
                    <option value="GBA">Game Boy Advance</option>
                    <option value="Dreamcast">Dreamcast</option>
                  </select>
                </div>

                <div className="writer-field" style={{ width: '140px' }}>
                  <label className="writer-field-label">STATUS</label>
                  <select
                    value={gameStatus}
                    onChange={(e) => setGameStatus(e.target.value)}
                    className="writer-input"
                  >
                    <option value="Beaten">★ Beaten</option>
                    <option value="Playing">🕹 Playing</option>
                    <option value="Backlog">⏳ Backlog</option>
                  </select>
                </div>

                <div className="writer-field flex-1">
                  <label className="writer-field-label">SCORE</label>
                  <select
                    value={gameScore}
                    onChange={(e) => setGameScore(e.target.value)}
                    className="writer-input"
                  >
                    <option value="10/10">10 / 10 (Masterpiece)</option>
                    <option value="9.5/10">9.5 / 10 (Legendary)</option>
                    <option value="9.0/10">9.0 / 10 (Outstanding)</option>
                    <option value="8.5/10">8.5 / 10 (Great)</option>
                    <option value="8.0/10">8.0 / 10 (Very Good)</option>
                    <option value="7.0/10">7.0 / 10 (Good)</option>
                  </select>
                </div>

                <div className="writer-field" style={{ width: '100px' }}>
                  <label className="writer-field-label">YEAR</label>
                  <input
                    placeholder="e.g. 1995"
                    value={gameYear}
                    onChange={(e) => setGameYear(e.target.value)}
                    className="writer-input"
                    maxLength={4}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. POEMS (❀) */}
          {f.type === 'poem' && (
            <div className="writer-themed-fields poem-inputs">
              <div className="writer-field">
                <label className="writer-field-label">EPIGRAPH / DEDICATION / NOTE</label>
                <input
                  placeholder="e.g. Dedicated to..., or written on a rainy train to Delhi"
                  value={f.extra || ''}
                  onChange={setField('extra')}
                  className="writer-input"
                />
              </div>
            </div>
          )}

          {/* 6. BUCKET LIST (☑) */}
          {f.type === 'bucket' && (
            <div className="writer-themed-fields bucket-inputs">
              <div className="writer-field-row align-center">
                <label className="bucket-status-checkbox">
                  <input
                    type="checkbox"
                    checked={bucketDone}
                    onChange={(e) => {
                      playPaperTear();
                      setBucketDone(e.target.checked);
                    }}
                  />
                  <span>Already achieved / completed?</span>
                </label>

                {bucketDone && (
                  <div className="writer-field flex-1" style={{ margin: 0 }}>
                    <input
                      placeholder="Date achieved (e.g. 2024 or Nov 2023)"
                      value={bucketDate}
                      onChange={(e) => setBucketDate(e.target.value)}
                      className="writer-input"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 7. THOUGHTS (☁) */}
          {f.type === 'thought' && (
            <div className="writer-themed-fields thought-inputs">
              <label className="writer-field-label">STICKY NOTE COLOR TINT</label>
              <div className="thought-color-picker">
                {[
                  ['yellow', '🟡 Yellow'],
                  ['pink', '🌸 Pink'],
                  ['mint', '🍃 Mint'],
                  ['lavender', '🪻 Lavender'],
                  ['blue', '🌊 Sky'],
                ].map(([c, label]) => (
                  <button
                    key={c}
                    type="button"
                    className={`color-pill ${thoughtColor === c ? 'active' : ''}`}
                    onClick={() => {
                      playBeep();
                      setThoughtColor(c);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 8. FINDS / BOOKMARKS (⌕) */}
          {f.type === 'find' && (
            <div className="writer-themed-fields find-inputs">
              <div className="writer-field">
                <label className="writer-field-label">TARGET LINK URL</label>
                <input
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="writer-input"
                />
              </div>
            </div>
          )}

          {/* 9. WORK & PROJECTS (⚙) */}
          {f.type === 'project' && (
            <div className="writer-themed-fields project-inputs">
              <div className="writer-field-row">
                <div className="writer-field flex-1">
                  <label className="writer-field-label">TECH STACK TAGS</label>
                  <input
                    placeholder="e.g. React · Vite · Firebase · Web Audio"
                    value={projectTech}
                    onChange={(e) => setProjectTech(e.target.value)}
                    className="writer-input"
                  />
                </div>
                <div className="writer-field flex-1">
                  <label className="writer-field-label">LIVE DEMO URL</label>
                  <input
                    placeholder="https://..."
                    value={projectDemo}
                    onChange={(e) => setProjectDemo(e.target.value)}
                    className="writer-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 10. TIMELINE (◷) */}
          {f.type === 'timeline' && (
            <div className="writer-themed-fields timeline-inputs">
              <div className="writer-field">
                <label className="writer-field-label">STATION DATE / YEAR</label>
                <input
                  placeholder="e.g. 2024 or Summer 2021"
                  value={f.extra || ''}
                  onChange={setField('extra')}
                  className="writer-input"
                />
              </div>
            </div>
          )}

          {/* 11. QUOTES (❝) */}
          {f.type === 'quote' && (
            <div className="writer-themed-fields quote-inputs">
              <div className="writer-field">
                <label className="writer-field-label">SOURCE / BOOK / FILM / CONTEXT</label>
                <input
                  placeholder="e.g. The Stranger (1942), or Overheard in a café"
                  value={f.extra || ''}
                  onChange={setField('extra')}
                  className="writer-input"
                />
              </div>
            </div>
          )}

          {/* Media / Image Upload */}
          <div className="writer-field image-upload-field">
            <label className="writer-field-label">
              {f.type === 'review'
                ? 'ATTACH MOVIE POSTER'
                : f.type === 'book'
                  ? 'ATTACH BOOK COVER'
                  : f.type === 'music'
                    ? 'ATTACH ALBUM JACKET'
                    : f.type === 'game'
                      ? 'ATTACH CARTRIDGE BOXART / SCREENSHOT'
                      : 'ATTACH PHOTO / MEDIA'}
            </label>
            <div className="image-upload-row">
              <input
                placeholder="Image URL or upload from device ➔"
                value={f.image || ''}
                onChange={setField('image')}
                className="writer-input flex-1"
              />
              <label className="cloudinary-btn">
                <span>📁 Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            {uploading && <small className="uploading-msg">Uploading to Cloudinary...</small>}
          </div>

          {/* Main Body Textarea */}
          <div className="writer-field flex-1">
            <div className="body-label-row">
              <label className="writer-field-label">
                {f.type === 'poem'
                  ? 'VERSES (TYPEWRITER)'
                  : f.type === 'review'
                    ? 'FILM CRITIQUE / NOTES'
                    : f.type === 'book'
                      ? 'READER REFLECTIONS & QUOTES'
                      : f.type === 'music'
                        ? 'LINER NOTES & IMPRESSIONS'
                        : f.type === 'game'
                          ? 'PLAYTHROUGH REVIEW'
                          : f.type === 'quote'
                            ? 'QUOTE BODY'
                            : f.type === 'letter'
                              ? 'LETTER TEXT'
                              : 'MARKDOWN CONTENT'}
              </label>
              <span className="writer-stats">
                {words} words · ~{rTime} min read
              </span>
            </div>

            <textarea
              placeholder={activeTheme.bodyPlaceholder}
              value={f.body}
              onChange={handleBodyChange}
              className={`writer-textarea ${f.type === 'poem' ? 'poem-textarea' : ''} ${errors.body ? 'input-error' : ''}`}
            />
            {errors.body && <span className="field-error">{errors.body}</span>}
          </div>

          {/* Actions */}
          <div className="writer-actions-bar">
            <button onClick={save} disabled={saving} className="writer-save-btn">
              {saving ? 'TRANSMITTING…' : f.draft ? '💾 SAVE DRAFT' : '🚀 PUBLISH TO WIRE'}
            </button>
            <button onClick={handleCancel} className="writer-cancel-btn">
              CANCEL
            </button>
          </div>
        </div>

        {/* Right Side: Live Thematic Preview Pane */}
        <div className="writer-preview-pane">
          <div className="writer-preview-header">
            <span className="preview-tag">LIVE THEME PREVIEW</span>
            <small>Updates in real time as you write</small>
          </div>

          <div className="writer-preview-canvas">
            <ThematicCard
              r={previewEntry}
              admin={false}
              onEdit={() => {}}
              reload={() => {}}
              index={0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
