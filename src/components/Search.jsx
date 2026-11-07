import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { NAME, md } from '../constants';
import Loader from './Loader';

/**
 * Search component — filters entries by title/body across all sections.
 * Features: debounced input, inline results, keyboard shortcut (/ to focus).
 */
export default function Search({ onNavigate }) {
  const [queryStr, setQueryStr] = useState('');
  const [results, setResults] = useState([]);
  const [allEntries, setAllEntries] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Load all entries once when search is first used
  const loadAll = useCallback(async () => {
    if (allEntries) return allEntries;
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'entries'));
      const entries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllEntries(entries);
      setLoading(false);
      return entries;
    } catch {
      setLoading(false);
      return [];
    }
  }, [allEntries]);

  // Debounced search
  useEffect(() => {
    if (!queryStr.trim()) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const entries = await loadAll();
      const q = queryStr.toLowerCase();
      const filtered = entries.filter(
        e =>
          (e.title || '').toLowerCase().includes(q) ||
          (e.body || '').toLowerCase().includes(q)
      );
      filtered.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
      setResults(filtered.slice(0, 20));
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [queryStr, loadAll]);

  // Keyboard shortcut: / to focus search
  useEffect(() => {
    const handler = (e) => {
      if (
        e.key === '/' &&
        !e.ctrlKey &&
        !e.metaKey &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="search-container">
      <div className="search-input-wrap">
        <span className="search-icon">⌕</span>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder='search entries… (press "/" to focus)'
          value={queryStr}
          onChange={e => setQueryStr(e.target.value)}
        />
        {queryStr && (
          <button
            className="search-clear"
            onClick={() => {
              setQueryStr('');
              setResults([]);
              inputRef.current?.focus();
            }}
          >
            ✕
          </button>
        )}
      </div>

      {loading && <Loader count={2} />}

      {queryStr.trim() && !loading && (
        <div className="search-results">
          {results.length === 0 ? (
            <p className="empty-state">no results found.</p>
          ) : (
            <>
              <small className="search-count">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </small>
              {results.map(r => (
                <article
                  key={r.id}
                  className="card search-result"
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                >
                  <h3>{r.title || 'untitled'}</h3>
                  <small>{NAME[r.type]}</small>
                  {expanded === r.id && (
                    <div className="md" dangerouslySetInnerHTML={md(r.body)} />
                  )}
                </article>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
