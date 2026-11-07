import { useState, useEffect } from 'react';
import { db, auth, provider, ADMIN } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { signInWithPopup, signOut } from 'firebase/auth';
import { useToast } from './Toast';
import Editor from './Editor';
import PostList from './PostList';
import { NOW_ICONS } from '../constants';

/**
 * Admin panel component.
 * Features: entry management, "Now" status editor, confirmation dialogs,
 * success feedback, sign in/out.
 */
export default function Admin({ admin }) {
  const [ed, setEd] = useState(null);
  const [st, setSt] = useState({});
  const [listKey, setListKey] = useState(0);
  const [savingNow, setSavingNow] = useState(false);
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
      await setDoc(doc(db, 'meta', 'status'), st);
      toast('Now status saved', 'success');
    } catch (err) {
      toast('Failed to save status: ' + err.message, 'error');
    } finally {
      setSavingNow(false);
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
          setListKey(k => k + 1);
        }}
      />
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-actions">
        <button onClick={() => setEd('new')}>+ new entry</button>
        <button onClick={handleSignOut}>sign out</button>
      </div>

      <h3>now</h3>
      <div className="now-editor">
        {['listening', 'watching', 'reading', 'thought'].map(x => (
          <div key={x} className="now-field">
            <label>
              {NOW_ICONS[x]} {x}
            </label>
            <input
              placeholder={x}
              value={st[x] || ''}
              onChange={e => setSt({ ...st, [x]: e.target.value })}
            />
          </div>
        ))}
      </div>
      <button onClick={saveNow} disabled={savingNow}>
        {savingNow ? 'saving…' : 'save now'}
      </button>

      <h3>all entries</h3>
      <PostList key={listKey} t="archive" admin onEdit={setEd} />
    </div>
  );
}
