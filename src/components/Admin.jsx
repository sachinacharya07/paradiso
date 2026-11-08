import { useState, useEffect } from 'react';
import { db, auth, provider } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} from 'firebase/firestore';
import { signInWithPopup, signOut } from 'firebase/auth';
import { useToast } from './Toast';
import Editor from './Editor';
import PostList from './PostList';
import { NOW_ICONS, SEC } from '../constants';
import { playFloppySave, playBeep, playPaperTear } from '../utils/sound';

/**
 * Admin panel component with:
 * - 1-Click JSON & Markdown Backup exporter
 * - Live Spotify / Last.fm user integration for now.txt
 * - Draft entry indicator
 * - Status updater
 */
export default function Admin({ admin }) {
  const [ed, setEd] = useState(null);
  const [st, setSt] = useState({});
  const [listKey, setListKey] = useState(0);
  const [adminSec, setAdminSec] = useState('archive');
  const [savingNow, setSavingNow] = useState(false);
  const [exporting, setExporting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'meta', 'status'));
        setSt(snap.data() || {});
      } catch (err) {
        toast('Failed to load status: ' + err.message, 'error');
      }
    })();
  }, [toast]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      toast('Sign in failed: ' + err.message, 'error');
    }
  };

  const handleSignOut = async () => {
    if (!window.confirm('Sign out?')) return;
    try {
      await signOut(auth);
      toast('Signed out', 'success');
    } catch (err) {
      toast('Sign out failed: ' + err.message, 'error');
    }
  };

  const saveNow = async () => {
    setSavingNow(true);
    try {
      playFloppySave();
      await setDoc(doc(db, 'meta', 'status'), st);
      toast('Now status saved', 'success');
    } catch (err) {
      toast('Failed to save status: ' + err.message, 'error');
    } finally {
      setSavingNow(false);
    }
  };

  /**
   * 1-Click Backup Export to JSON
   */
  const handleExportJson = async () => {
    setExporting(true);
    playBeep();
    try {
      const snap = await getDocs(collection(db, 'entries'));
      const entries = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        date: d.data().date?.toDate ? d.data().date.toDate().toISOString() : d.data().date,
      }));

      const jsonStr = JSON.stringify(
        {
          site: 'paradiso',
          exportedAt: new Date().toISOString(),
          totalEntries: entries.length,
          entries,
        },
        null,
        2
      );

      playFloppySave();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `paradiso-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast(`Exported ${entries.length} entries to JSON`, 'success');
    } catch (err) {
      toast('Export failed: ' + err.message, 'error');
    } finally {
      setExporting(false);
    }
  };

  /**
   * 1-Click Backup Export to Markdown
   */
  const handleExportMarkdown = async () => {
    setExporting(true);
    playBeep();
    try {
      const snap = await getDocs(collection(db, 'entries'));
      const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      let mdContent = `# Paradiso Content Archive\n*Exported on ${new Date().toLocaleDateString()}*\n\n---\n\n`;
      entries.forEach((e) => {
        mdContent += `## [${e.type ? e.type.toUpperCase() : 'POST'}] ${e.title || 'Untitled'}\n`;
        if (e.extra) mdContent += `*Extra: ${e.extra}*\n`;
        if (e.image) mdContent += `![Image](${e.image})\n\n`;
        mdContent += `${e.body || ''}\n\n---\n\n`;
      });

      playFloppySave();
      const blob = new Blob([mdContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `paradiso-archive-${new Date().toISOString().slice(0, 10)}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast(`Exported archive to Markdown`, 'success');
    } catch (err) {
      toast('Export failed: ' + err.message, 'error');
    } finally {
      setExporting(false);
    }
  };

  if (!admin) {
    return (
      <div className="admin-signin">
        <p>Sign in as admin to manage entries.</p>
        <button onClick={handleSignIn}>sign in with Google</button>
      </div>
    );
  }

  if (ed) {
    return (
      <Editor
        init={ed === 'new' ? null : ed}
        done={() => {
          setEd(null);
          setListKey((k) => k + 1);
        }}
      />
    );
  }

  return (
    <div className="admin-panel">
      {/* Top action buttons */}
      <div className="admin-actions">
        <button onClick={() => setEd('new')}>+ new entry</button>
        <button onClick={handleExportJson} disabled={exporting}>
          💾 export JSON backup
        </button>
        <button onClick={handleExportMarkdown} disabled={exporting}>
          📄 export Markdown
        </button>
        <button onClick={handleSignOut} className="sign-out-btn">
          sign out
        </button>
      </div>

      {/* "Now" status editor with live Last.fm sync support */}
      <h3>now</h3>
      <div className="now-editor">
        {['listening', 'watching', 'reading', 'thought'].map((x) => (
          <div key={x} className="now-field">
            <label>
              {NOW_ICONS[x]} {x}
            </label>
            <input
              placeholder={x}
              value={st[x] || ''}
              onChange={(e) => setSt({ ...st, [x]: e.target.value })}
            />
          </div>
        ))}

        {/* Optional Last.fm username for automatic Spotify sync */}
        <div className="now-field">
          <label title="Your Last.fm username to auto-sync Spotify now-playing">
            🎵 last.fm user
          </label>
          <input
            placeholder="e.g. your_lastfm_username (auto-syncs Spotify)"
            value={st.lastFmUser || ''}
            onChange={(e) => setSt({ ...st, lastFmUser: e.target.value.trim() })}
          />
        </div>
      </div>
      <button onClick={saveNow} disabled={savingNow}>
        {savingNow ? 'saving…' : 'save now'}
      </button>

      <div className="admin-entries-header">
        <div className="admin-entries-title-row">
          <h3>entries manager</h3>
          <span className="admin-active-sec-pill">
            SHOWING: {adminSec === 'archive' ? 'ALL SECTIONS' : (SEC.find(s => s[0] === adminSec)?.[1] || adminSec).toUpperCase()}
          </span>
        </div>

        {/* Separated section category tabs */}
        <div className="admin-category-tabs">
          <button
            type="button"
            className={`admin-cat-tab ${adminSec === 'archive' ? 'active' : ''}`}
            onClick={() => {
              playPaperTear();
              setAdminSec('archive');
            }}
          >
            ☰ ALL ARCHIVES
          </button>
          {SEC.map(([k, name, icon]) => (
            <button
              key={k}
              type="button"
              className={`admin-cat-tab ${adminSec === k ? 'active' : ''}`}
              onClick={() => {
                playPaperTear();
                setAdminSec(k);
              }}
            >
              <span>{icon}</span> {name}
            </button>
          ))}
        </div>
      </div>

      <PostList key={`${adminSec}-${listKey}`} t={adminSec} admin onEdit={setEd} />
    </div>
  );
}
