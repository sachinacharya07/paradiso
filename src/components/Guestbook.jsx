import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useToast } from './Toast';

/**
 * Guestbook component.
 * Features: spam protection (honeypot + rate limiting), admin approval/delete,
 * error handling on all operations.
 */
export default function Guestbook({ admin }) {
  const [rows, setRows] = useState([]);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [trap, setTrap] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const toast = useToast();

  const load = async () => {
    try {
      const q = admin
        ? collection(db, 'guestbook')
        : query(collection(db, 'guestbook'), where('approved', '==', true));
      const snap = await getDocs(q);
      const entries = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRows(entries);
    } catch (err) {
      toast('Failed to load guestbook: ' + err.message, 'error');
    }
  };

  useEffect(() => {
    load();
  }, [admin]);

  const send = async () => {
    // Honeypot check
    if (trap) return;
    if (!name.trim() || !msg.trim()) {
      toast('Please fill in your name and message', 'error');
      return;
    }
    // Rate limiting
    const last = +localStorage.getItem('gb') || 0;
    if (Date.now() - last < 60000) {
      toast('Please wait a minute before sending again', 'error');
      return;
    }
    setSending(true);
    try {
      await addDoc(collection(db, 'guestbook'), {
        name: name.slice(0, 40),
        msg: msg.slice(0, 300),
        approved: false,
        createdAt: serverTimestamp(),
      });
      localStorage.setItem('gb', String(Date.now()));
      setName('');
      setMsg('');
      setSubmitted(true);
      toast('Message sent! It will appear after approval.', 'success');
    } catch (err) {
      toast('Failed to send message: ' + err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await updateDoc(doc(db, 'guestbook', id), { approved: true });
      toast('Message approved', 'success');
      load();
    } catch (err) {
      toast('Failed to approve: ' + err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this guestbook entry?')) return;
    try {
      await deleteDoc(doc(db, 'guestbook', id));
      toast('Message deleted', 'success');
      load();
    } catch (err) {
      toast('Failed to delete: ' + err.message, 'error');
    }
  };

  return (
    <div className="guestbook">
      <div className="guestbook-form">
        <input
          placeholder="name"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={40}
        />
        <textarea
          placeholder="leave a message"
          value={msg}
          onChange={e => setMsg(e.target.value)}
          maxLength={300}
        />
        {/* Honeypot field */}
        <input
          className="trap"
          tabIndex={-1}
          autoComplete="off"
          value={trap}
          onChange={e => setTrap(e.target.value)}
          aria-hidden="true"
        />
        <button onClick={send} disabled={sending}>
          {sending ? 'sending…' : 'sign'}
        </button>
        {submitted && (
          <small className="guestbook-thanks">
            thanks! it shows up after I approve it.
          </small>
        )}
      </div>

      <div className="guestbook-entries">
        {rows.map((r, i) => (
          <article
            className="card card-enter"
            key={r.id}
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <b>{r.name}</b>
            <p>{r.msg}</p>
            {admin && (
              <div className="card-actions">
                {!r.approved && (
                  <button
                    className="card-action-btn"
                    onClick={() => handleApprove(r.id)}
                  >
                    ✓ approve
                  </button>
                )}
                <button
                  className="card-action-btn"
                  onClick={() => handleDelete(r.id)}
                >
                  ✕ delete
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
