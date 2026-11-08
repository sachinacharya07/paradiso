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
import { playTypewriterClick, playBeep } from '../utils/sound';

export const PIXEL_STAMPS = [
  { id: 'invader', icon: '👾', label: 'Retro Invader' },
  { id: 'coffee', icon: '☕', label: 'Coffee' },
  { id: 'vhs', icon: '📼', label: 'VHS' },
  { id: 'sparkle', icon: '✦', label: 'Sparkle' },
  { id: 'flower', icon: '🌸', label: 'Blossom' },
  { id: 'bolt', icon: '⚡', label: 'Lightning' },
];

/**
 * Guestbook component with:
 * - Mechanical typewriter audio clicks on typing
 * - Pixel stamps / reaction badge picker
 * - Admin replies from Sachin ([SACHIN REPLIED: "..."])
 * - Honeypot spam defense & rate limiting
 */
export default function Guestbook({ admin }) {
  const [rows, setRows] = useState([]);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [selectedStamp, setSelectedStamp] = useState('✦');
  const [trap, setTrap] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  // Admin reply states
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const toast = useToast();

  const load = async () => {
    try {
      const q = admin
        ? collection(db, 'guestbook')
        : query(collection(db, 'guestbook'), where('approved', '==', true));
      const snap = await getDocs(q);
      const entries = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRows(entries);
    } catch (err) {
      toast('Failed to load guestbook: ' + err.message, 'error');
    }
  };

  useEffect(() => {
    load();
  }, [admin]);

  const handleInputChange = (setter) => (e) => {
    playTypewriterClick();
    setter(e.target.value);
  };

  const send = async () => {
    if (trap) return;
    if (!name.trim() || !msg.trim()) {
      toast('Please enter your name and message', 'error');
      return;
    }

    const last = +localStorage.getItem('gb') || 0;
    if (Date.now() - last < 60000) {
      toast('Please wait a minute before sending another message', 'error');
      return;
    }

    setSending(true);
    try {
      await addDoc(collection(db, 'guestbook'), {
        name: name.slice(0, 40),
        msg: msg.slice(0, 300),
        stamp: selectedStamp,
        approved: false,
        createdAt: serverTimestamp(),
      });
      localStorage.setItem('gb', String(Date.now()));
      setName('');
      setMsg('');
      setSubmitted(true);
      toast('Message dispatched! It will appear once approved.', 'success');
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

  const handleSendReply = async (id) => {
    if (!replyText.trim()) return;
    try {
      await updateDoc(doc(db, 'guestbook', id), {
        adminReply: replyText.trim(),
        replyAt: serverTimestamp(),
      });
      toast('Reply posted', 'success');
      setReplyingId(null);
      setReplyText('');
      load();
    } catch (err) {
      toast('Failed to post reply: ' + err.message, 'error');
    }
  };

  return (
    <div className="guestbook">
      {/* Sign Guestbook Form */}
      <div className="guestbook-form win">
        <div className="bar guestbook-form-bar">
          <span>Leave a Telegram</span>
        </div>

        <div className="guestbook-form-body">
          <input
            placeholder="Your name or alias"
            value={name}
            onChange={handleInputChange(setName)}
            maxLength={40}
          />

          <textarea
            placeholder="Type your message here... (listen to the typewriter keys!)"
            value={msg}
            onChange={handleInputChange(setMsg)}
            maxLength={300}
          />

          {/* Pixel Stamp Picker */}
          <div className="stamp-picker-row">
            <span className="stamp-picker-label">CHOOSE A STAMP:</span>
            <div className="stamp-options">
              {PIXEL_STAMPS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`stamp-opt-btn ${selectedStamp === s.icon ? 'selected' : ''}`}
                  onClick={() => {
                    playBeep();
                    setSelectedStamp(s.icon);
                  }}
                  title={s.label}
                >
                  {s.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Honeypot field */}
          <input
            className="trap"
            tabIndex={-1}
            autoComplete="off"
            value={trap}
            onChange={(e) => setTrap(e.target.value)}
            aria-hidden="true"
          />

          <div className="guestbook-submit-row">
            <button onClick={send} disabled={sending} className="guestbook-sign-btn">
              {sending ? 'TRANSMITTING…' : 'TRANSMIT ✉'}
            </button>
            {submitted && (
              <small className="guestbook-thanks">
                thanks! It shows up on the wire after Sachin approves it.
              </small>
            )}
          </div>
        </div>
      </div>

      {/* Guestbook Messages */}
      <div className="guestbook-entries">
        {rows.map((r, i) => (
          <article
            className="guestbook-card card-enter"
            key={r.id}
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className="guestbook-card-header">
              <div className="guestbook-user">
                <span className="guestbook-stamp-icon">{r.stamp || '✦'}</span>
                <b>{r.name}</b>
              </div>
              <span className="guestbook-meta-badge">
                {r.approved ? 'VERIFIED' : 'PENDING'}
              </span>
            </div>

            <p className="guestbook-msg">{r.msg}</p>

            {/* Admin Reply Display */}
            {r.adminReply && (
              <div className="admin-reply-box">
                <div className="admin-reply-header">
                  <span className="admin-reply-stamp">★ SACHIN REPLIED:</span>
                </div>
                <p className="admin-reply-body">{r.adminReply}</p>
              </div>
            )}

            {/* Admin Controls */}
            {admin && (
              <div className="guestbook-admin-actions">
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
                  onClick={() => setReplyingId(replyingId === r.id ? null : r.id)}
                >
                  ✍ reply
                </button>
                <button
                  className="card-action-btn"
                  onClick={() => handleDelete(r.id)}
                >
                  ✕ delete
                </button>
              </div>
            )}

            {/* Inline Admin Reply Form */}
            {admin && replyingId === r.id && (
              <div className="admin-reply-form">
                <textarea
                  placeholder="Type your reply as Sachin..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={2}
                />
                <div className="admin-reply-buttons">
                  <button onClick={() => handleSendReply(r.id)}>Post Reply</button>
                  <button onClick={() => setReplyingId(null)}>Cancel</button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
