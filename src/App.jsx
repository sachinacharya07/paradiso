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
import { SEC, NAME, VALID_SECTIONS, NOW_ICONS, beep, md } from './constants';
import { useTheme } from './hooks/useTheme';
import { useToast } from './components/Toast';
import ThemeToggle from './components/ThemeToggle';
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
  const au = useRef(null);
  const toast = useToast();
  const [theme, toggleTheme] = useTheme();

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

    // Auth listener with proper cleanup
    const unsubAuth = onAuthStateChanged(auth, u => {
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
        snap.docs.forEach(d => {
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

  // Keyboard shortcuts: Escape to go home
  useEffect(() => {
    const handler = (e) => {
      if (
        e.key === 'Escape' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        if (rnd) {
          setRnd(null);
        } else {
          location.hash = '';
          setSec('');
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [rnd]);

  // Back to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Random entry
  const random = useCallback(async (e) => {
    if (e) e.preventDefault();
    beep();
    try {
      const snap = await getDocs(collection(db, 'entries'));
      const all = snap.docs.map(d => d.data()).filter(d => d.type !== 'letter');
      const facts = all.filter(d => d.type === 'fact');
      const pool = Math.random() < 0.5 && facts.length ? facts : all;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      setRnd(pick || { title: 'nothing yet', body: '' });
    } catch (err) {
      toast('Failed to load random entry: ' + err.message, 'error');
    }
  }, [toast]);

  // Music toggle
  const toggleMusic = () => {
    if (!au.current) return;
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
      <main
        className="desk"
        onClick={e => e.target.closest('button,a,.ico') && beep()}
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
              <a className="ico" href="#" role="button" onClick={random} aria-label="Random entry">
                <span>?</span>
                <span className="ico-label">Random Me</span>
              </a>
            </nav>

            {/* Now status window */}
            <section className="win now-window">
              <div className="bar">now.txt</div>
              <div className="body">
                {['listening', 'watching', 'reading'].map(
                  x =>
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
                {!st.listening && !st.watching && !st.reading && !st.thought && (
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

        {/* ===== RANDOM MODAL ===== */}
        {rnd && (
          <div className="modal" onClick={() => setRnd(null)}>
            <div className="win modal-win" onClick={e => e.stopPropagation()}>
              <div className="bar">
                <span>random me</span>
                <a
                  href="#"
                  onClick={e => {
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
                  <img src={rnd.image} alt={rnd.title || 'Random entry image'} />
                )}
                <div className="md" dangerouslySetInnerHTML={md(rnd.body)} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ===== TASKBAR ===== */}
      <footer className="task">
        <a href="#" aria-label="Home">▶ {SITE}</a>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        <span aria-label="Visitor count">
          {cnt != null && `visitors: ${String(cnt).padStart(6, '0')}`}
        </span>
        {MUSIC && (
          <>
            <audio ref={au} src={MUSIC} loop />
            <button onClick={toggleMusic} aria-label={play ? 'Pause music' : 'Play music'}>
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
