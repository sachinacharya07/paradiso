import { useState, useMemo } from 'react';
import AirmailLetter from './AirmailLetter';
import { playPaperTear, playBeep } from '../../utils/sound';

export default function LetterSection({ items, admin = false, onEdit, reload }) {
  const [nameQuery, setNameQuery] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('all');

  // Extract all unique recipient names from the letter titles
  const recipients = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      const name = (item.title || 'Someone special').trim();
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries());
  }, [items]);

  // Filter letters based on recipient chip or search input
  const filteredLetters = useMemo(() => {
    let list = [...items];

    // Recipient chip filter
    if (selectedRecipient !== 'all') {
      list = list.filter((r) => (r.title || '').trim().toLowerCase() === selectedRecipient.toLowerCase());
    }

    // Name search query
    if (nameQuery.trim()) {
      const q = nameQuery.toLowerCase().trim();
      list = list.filter((r) => {
        const titleMatch = (r.title || '').toLowerCase().includes(q);
        const bodyMatch = (r.body || '').toLowerCase().includes(q);
        return titleMatch || bodyMatch;
      });
    }

    // Sort newest first
    list.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));

    return list;
  }, [items, selectedRecipient, nameQuery]);

  return (
    <div className="letter-section-wrap">
      {/* Postal Bureau Header Banner */}
      <div className="section-header-banner letter-banner">
        <div className="section-banner-title-box">
          <span className="section-banner-icon">✉</span>
          <div>
            <h2 className="section-banner-heading">POSTAL BUREAU · LETTERS FROM SACHIN</h2>
            <p className="section-banner-sub">
              Personal correspondence, unmailed dispatches, and letters to friends, places, and future selves.
            </p>
          </div>
        </div>

        <div className="section-stat-badges">
          <div className="stat-badge">
            <span className="stat-num">{items.length}</span>
            <span className="stat-lbl">LETTERS</span>
          </div>
          <div className="stat-badge">
            <span className="stat-num">{recipients.length}</span>
            <span className="stat-lbl">RECIPIENTS</span>
          </div>
        </div>
      </div>

      {/* Recipient Search & Name Lookup Box */}
      <div className="letter-search-box">
        <div className="letter-search-input-wrapper">
          <span className="letter-search-icon">🔍</span>
          <input
            type="search"
            placeholder="Search for your name (e.g. Maya, Future Self, Kabir, Bombay)..."
            value={nameQuery}
            onChange={(e) => {
              setNameQuery(e.target.value);
              if (selectedRecipient !== 'all') setSelectedRecipient('all');
            }}
            className="letter-name-input"
          />
          {nameQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setNameQuery('')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Recipient Name Chips */}
        {recipients.length > 0 && (
          <div className="recipient-chips-row">
            <span className="chips-label">RECIPIENTS:</span>
            <button
              type="button"
              className={`recipient-chip ${selectedRecipient === 'all' && !nameQuery ? 'active' : ''}`}
              onClick={() => {
                playPaperTear();
                setSelectedRecipient('all');
                setNameQuery('');
              }}
            >
              ALL ({items.length})
            </button>

            {recipients.map(([name, count]) => (
              <button
                key={name}
                type="button"
                className={`recipient-chip ${selectedRecipient.toLowerCase() === name.toLowerCase() ? 'active' : ''}`}
                onClick={() => {
                  playPaperTear();
                  setSelectedRecipient(name);
                  setNameQuery('');
                }}
              >
                <span>To: {name}</span>
                <span className="chip-count">({count})</span>
              </button>
            ))}
          </div>
        )}

        {/* Search Feedback Note */}
        {nameQuery.trim() && (
          <div className="search-feedback-note">
            {filteredLetters.length > 0 ? (
              <span className="match-found">
                ✉ Found <b>{filteredLetters.length}</b> letter(s) matching "<b>{nameQuery}</b>" from Sachin
              </span>
            ) : (
              <span className="no-match-found">
                No letters addressed to "<b>{nameQuery}</b>" yet. Sachin hasn't penned a dispatch for this name yet!
                Feel free to request one in the guestbook ☺
              </span>
            )}
          </div>
        )}
      </div>

      {/* Letters List */}
      <div className="letters-list">
        {filteredLetters.length === 0 ? (
          <div className="empty-state letter-empty">
            <p>No correspondence found for this search.</p>
            <button
              type="button"
              className="filter-btn"
              onClick={() => {
                playBeep();
                setNameQuery('');
                setSelectedRecipient('all');
              }}
            >
              Show all letters
            </button>
          </div>
        ) : (
          filteredLetters.map((r, i) => (
            <AirmailLetter
              key={r.id}
              r={r}
              admin={admin}
              onEdit={onEdit}
              reload={reload}
              index={i}
            />
          ))
        )}
      </div>
    </div>
  );
}
