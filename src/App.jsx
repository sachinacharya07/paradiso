import { useEffect, useRef, useState, useCallback } from 'react';
import { db, auth, ADMIN, SITE, MUSIC } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  increment,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { SEC, NAME, VALID_SECTIONS, NOW_ICONS, md } from './constants';
import { useTheme } from './hooks/useTheme';
import { useDesktopTheme } from './hooks/useDesktopTheme';
import { useToast } from './components/Toast';
import { playBeep, playCassetteClick } from './utils/sound';

import ThemeToggle from './components/ThemeToggle';
import DesktopContextMenu from './components/DesktopContextMenu';
import PostList from './components/PostList';
import Admin from './components/Admin';
import Guestbook from './components/Guestbook';
import Search from './components/Search';

export default function App() {
  const [sec, setSec] = useState(location.hash.slice(1));
  const [admin, setAdmin] = useState(false);
  const [st, setSt] = useState({});
  const [cnt, setCnt] = useState(null);
  const [rnd, setRnd] = useState(null);
  const [play, setPlay] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [entryCounts, setEntryCounts] = useState({});
  const [showSpecs, setShowSpecs] = useState(false);
  const [liveTrack, setLiveTrack] = useState(null);

  const au = useRef(null);
  const toast = useToast();
  const [theme, toggleTheme] = useTheme();

  // Desktop wallpaper, CRT, and sound controls
  const {
    wallpaper,
    setWallpaper,
    crtMode,
    cycleCrt,
    muted,
    toggleSound,
  } = useDesktopTheme();

  // Validate section — redirect unknown hashes to home
  const validSec = sec && VALID_SECTIONS.has(sec) ? sec : '';

  // Update document title on navigation
  useEffect(() => {
    const title =
      validSec === 'guest'
        ? 'Guestbook'
        : validSec === 'archive'
          ? 'Archive'
          : validSec === 'admin'
            ? 'Admin'
            : NAME[validSec];
    document.title = validSec
      ? `${title} — ${SITE}`
      : `${SITE} — by Sachin`;
  }, [validSec]);

  // Hash change listener + auth + counter + entry counts
  useEffect(() => {
    const handleHash = () => {
      const hash = location.hash.slice(1);
      if (hash && !VALID_SECTIONS.has(hash)) {
        location.hash = '';
        setSec('');
        return;
      }
      setSec(hash);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', handleHash);

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setAdmin(!!u && u.email === ADMIN);
    });

    // Load "now" status
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'meta', 'status'));
        setSt(snap.data() || {});
      } catch (err) {
        console.error('Failed to load status:', err);
      }
    })();

    // Visitor counter
    const counterDoc = doc(db, 'meta', 'counter');
    (async () => {
      try {
        if (!sessionStorage.getItem('v')) {
          sessionStorage.setItem('v', '1');
          await setDoc(counterDoc, { n: increment(1) }, { merge: true });
        }
        const snap = await getDoc(counterDoc);
        setCnt(snap.data()?.n);
      } catch (err) {
        console.error('Counter error:', err);
      }
    })();

    // Load entry counts for icon badges
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'entries'));
        const counts = {};
        snap.docs.forEach((d) => {
          const type = d.data().type;
          if (type) counts[type] = (counts[type] || 0) + 1;
        });
        setEntryCounts(counts);
      } catch {
        // non-critical
      }
    })();

    return () => {
      window.removeEventListener('hashchange', handleHash);
      unsubAuth();
    };
  }, []);

  // Live Spotify sync via Last.fm API
  useEffect(() => {
    if (!st.lastFmUser) return;
    const fetchLastFm = async () => {
      try {
        const res = await fetch(
          `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(
            st.lastFmUser
          )}&api_key=94cf9fc7598c1d5ec5bbd240d99ff604&format=json&limit=1`
        );
        const data = await res.json();
        const track = data?.recenttracks?.track?.[0];
        if (track) {
          const isNowPlaying = track['@attr']?.nowplaying === 'true';
          setLiveTrack({
            title: track.name,
            artist: track.artist['#text'],
            isPlaying: isNowPlaying,
          });
        }
      } catch {
        // silent fail
      }
    };

    fetchLastFm();
    const interval = setInterval(fetchLastFm, 25000);
    return () => clearInterval(interval);
  }, [st.lastFmUser]);

  // Keyboard shortcuts: Escape to close modals/windows
  useEffect(() => {
    const handler = (e) => {
      if (
        e.key === 'Escape' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        if (showSpecs) {
          setShowSpecs(false);
        } else if (rnd) {
          setRnd(null);
        } else {
          location.hash = '';
          setSec('');
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [rnd, showSpecs]);

  // Back to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Random entry — strictly personal facts & trivia about Sachin
  const random = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      playBeep();
      try {
        const snap = await getDocs(collection(db, 'entries'));
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const facts = all.filter((d) => d.type === 'fact');
        const thoughts = all.filter((d) => d.type === 'thought');
        const pool = facts.length > 0 ? facts : thoughts.length > 0 ? thoughts : [];

        if (pool.length > 0) {
          const pick = pool[Math.floor(Math.random() * pool.length)];
          setRnd(pick);
        } else {
          setRnd({
            title: 'Hi, I’m Sachin! ☺',
            body: 'Welcome to Paradiso! Add trivia and fun facts about yourself in the Admin panel under **About Me (☺)** to see them randomly appear here.',
          });
        }
      } catch (err) {
        toast('Failed to load random fact: ' + err.message, 'error');
      }
    },
    [toast]
  );

  // Music toggle with cassette latch sound
  const toggleMusic = () => {
    if (!au.current) return;
    playCassetteClick();
    if (play) {
      au.current.pause();
    } else {
      au.current.play();
    }
    setPlay(!play);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const windowTitle =
    validSec === 'guest'
      ? 'Guestbook'
      : validSec === 'archive'
        ? 'Archive'
        : validSec === 'admin'
          ? 'Admin'
          : NAME[validSec];

  return (
    <>
      {/* Desktop Right-Click Context Menu */}
      <DesktopContextMenu
        wallpaper={wallpaper}
        setWallpaper={setWallpaper}
        crtMode={crtMode}
        cycleCrt={cycleCrt}
        muted={muted}
        toggleSound={toggleSound}
        onOpenSpecs={() => setShowSpecs(true)}
      />

      <main
        className="desk"
        onClick={(e) => e.target.closest('button,a,.ico') && playBeep()}
      >
        {/* ===== HOMEPAGE ===== */}
        {!validSec && (
          <div className="home-view fade-in">
            <h1 className="glitch" data-t={SITE}>
              {SITE}
            </h1>
            <p className="by">by Sachin · 2026</p>

            {/* Search */}
            <Search />

            {/* Desktop icons grid */}
            <nav className="icons" aria-label="Sections">
              {SEC.map(([k, n, icon]) => (
                <a className="ico" key={k} href={'#' + k} aria-label={n}>
                  <span>{icon}</span>
                  <span className="ico-label">
                    {n}
                    {entryCounts[k] > 0 && (
                      <span className="badge" aria-label={`${entryCounts[k]} entries`}>
                        {entryCounts[k]}
                      </span>
                    )}
                  </span>
                </a>
              ))}
              <a className="ico" href="#archive" aria-label="Archive">
                <span>☰</span>
                <span className="ico-label">Archive</span>
              </a>
              <a className="ico" href="#guest" aria-label="Guestbook">
                <span>✍</span>
                <span className="ico-label">Guestbook</span>
              </a>
              <a
                className="ico"
                href="#"
                role="button"
                onClick={random}
                aria-label="Random fact about Sachin"
              >
                <span>?</span>
                <span className="ico-label">Random Me</span>
              </a>
            </nav>

            {/* Now status window with live Spotify integration */}
            <section className="win now-window">
              <div className="bar">
                <span>now.txt</span>
                {liveTrack && <span className="now-live-tag">LIVE SYNC 🎵</span>}
              </div>
              <div className="body">
                {/* Real-time Spotify / Last.fm Track */}
                {liveTrack ? (
                  <p className="now-live-track">
                    <span className="now-icon">🎧</span>
                    <b>currently listening:</b> {liveTrack.title} ― {liveTrack.artist}
                    {liveTrack.isPlaying && (
                      <span className="live-eq" title="Playing on Spotify">
                        {' '}ılı.lıllılı.ıllı
                      </span>
                    )}
                  </p>
                ) : (
                  st.listening && (
                    <p>
                      <span className="now-icon">{NOW_ICONS.listening}</span>
                      <b>currently listening:</b> {st.listening}
                    </p>
                  )
                )}

                {['watching', 'reading'].map(
                  (x) =>
                    st[x] && (
                      <p key={x}>
                        <span className="now-icon">{NOW_ICONS[x]}</span>
                        <b>currently {x}:</b> {st[x]}
                      </p>
                    )
                )}

                {st.thought && (
                  <p>
                    <span className="now-icon">{NOW_ICONS.thought}</span>
                    <b>thought of the day:</b> {st.thought}
                  </p>
                )}

                {!st.listening && !st.watching && !st.reading && !st.thought && !liveTrack && (
                  <p className="empty-state">nothing right now.</p>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ===== SECTION WINDOW ===== */}
        {validSec && (
          <section className="win section-window slide-in">
            <div className="bar">
              <span>{windowTitle}</span>
              <a href="#" title="Close (Esc)" aria-label="Close window">
                ✕
              </a>
            </div>
            <div className="body">
              {validSec === 'guest' ? (
                <Guestbook admin={admin} />
              ) : validSec === 'admin' ? (
                <Admin admin={admin} />
              ) : (
                <PostList t={validSec} admin={admin} />
              )}
            </div>
          </section>
        )}

        {/* ===== RANDOM ME MODAL ===== */}
        {rnd && (
          <div className="modal" onClick={() => setRnd(null)}>
            <div className="win modal-win" onClick={(e) => e.stopPropagation()}>
              <div className="bar">
                <span>random fact about me ☺</span>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setRnd(null);
                  }}
                  aria-label="Close modal"
                >
                  ✕
                </a>
              </div>
              <div className="body">
                <h3>{rnd.title}</h3>
                {rnd.image && (
                  <img src={rnd.image} alt={rnd.title || 'Fact attachment'} />
                )}
                <div className="md" dangerouslySetInnerHTML={md(rnd.body)} />
              </div>
            </div>
          </div>
        )}

        {/* ===== SYSTEM SPECS MODAL ===== */}
        {showSpecs && (
          <div className="modal" onClick={() => setShowSpecs(false)}>
            <div className="win modal-win" onClick={(e) => e.stopPropagation()}>
              <div className="bar">
                <span>System Properties · Paradiso OS</span>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowSpecs(false);
                  }}
                  aria-label="Close modal"
                >
                  ✕
                </a>
              </div>
              <div className="body system-specs-body">
                <div className="specs-header">
                  <span className="specs-logo">✦ PARADISO OS</span>
                  <small>Version 2.2 · Release 2026</small>
                </div>
                <hr className="specs-divider" />
                <div className="specs-grid">
                  <div><b>Architect:</b> Sachin Bhattacharya</div>
                  <div><b>Environment:</b> React 18 + Vite 5</div>
                  <div><b>Database:</b> Cloud Firestore (Decentralized)</div>
                  <div><b>Storage:</b> Cloudinary Media</div>
                  <div><b>Audio Engine:</b> Web Audio API Synthesizer</div>
                  <div><b>Active Wallpaper:</b> {wallpaper.toUpperCase()}</div>
                  <div><b>CRT Scanlines:</b> {crtMode.toUpperCase()}</div>
                  <div><b>Total Sections:</b> 15 Bespoke Themes</div>
                </div>
                <p className="specs-tip">
                  💡 Tip: Right-click anywhere on the desktop to change wallpapers, toggle CRT modes, or mute sounds!
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ===== TASKBAR ===== */}
      <footer className="task">
        <a href="#" aria-label="Home">▶ {SITE}</a>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

        {/* Sound Toggle Button */}
        <button
          className="taskbar-tool-btn"
          onClick={toggleSound}
          title={muted ? 'Sound Muted (Click to enable)' : 'Sound Enabled (Click to mute)'}
          aria-label={muted ? 'Enable sound' : 'Mute sound'}
        >
          {muted ? '🔇' : '🔊'}
        </button>

        {/* CRT Mode Cycler */}
        <button
          className="taskbar-tool-btn crt-btn"
          onClick={cycleCrt}
          title={`CRT Effect: ${crtMode.toUpperCase()} (Click to toggle)`}
        >
          CRT: {crtMode.toUpperCase()}
        </button>

        <span aria-label="Visitor count">
          {cnt != null && `visitors: ${String(cnt).padStart(6, '0')}`}
        </span>

        {MUSIC && (
          <>
            <audio ref={au} src={MUSIC} loop />
            <button
              onClick={toggleMusic}
              aria-label={play ? 'Pause music' : 'Play music'}
              title="Cassette Audio Player"
            >
              {play ? '❚❚' : '♪'}
            </button>
          </>
        )}
        <a href="#admin" aria-label="Admin panel">⚙</a>
      </footer>

      {/* ===== BACK TO TOP ===== */}
      {showBackToTop && (
        <button
          className="back-to-top"
          onClick={scrollToTop}
          title="Back to top"
          aria-label="Back to top"
        >
          ↑
        </button>
      )}
    </>
  );
}
