import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  limit,
  startAfter,
} from 'firebase/firestore';
import { SHORT, PAGE_SIZE } from '../constants';
import { useToast } from './Toast';
import Card from './Card';
import Scrapbook from './Scrapbook';
import Loader from './Loader';

/**
 * PostList component — fetches and displays entries for a given section type.
 * Handles archive mode (all entries) and individual section types.
 * Uses pagination with "Load more" button.
 */
export default function PostList({ t, admin = false, onEdit }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const lastDocRef = useRef(null);
  const toast = useToast();

  const buildQuery = useCallback((afterDoc) => {
    const col = collection(db, 'entries');
    const constraints = [];

    if (t === 'archive') {
      constraints.push(orderBy('date', 'desc'));
    } else {
      constraints.push(where('type', '==', t));
      constraints.push(orderBy('date', 'desc'));
    }
    constraints.push(limit(PAGE_SIZE));
    if (afterDoc) {
      constraints.push(startAfter(afterDoc));
    }
    return query(col, ...constraints);
  }, [t]);

  const load = useCallback(async (loadMore = false) => {
    try {
      setError(null);
      const q = buildQuery(loadMore ? lastDocRef.current : null);
      const snap = await getDocs(q);
      const entries = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Update last doc for pagination
      if (snap.docs.length > 0) {
        lastDocRef.current = snap.docs[snap.docs.length - 1];
      }
      setHasMore(snap.docs.length >= PAGE_SIZE);

      if (loadMore) {
        setRows(prev => [...(prev || []), ...entries]);
      } else {
        setRows(entries);
      }
    } catch (err) {
      setError(err.message);
      toast('Failed to load entries: ' + err.message, 'error');
      if (!loadMore) setRows([]);
    }
  }, [buildQuery, toast]);

  useEffect(() => {
    setRows(null);
    lastDocRef.current = null;
    load(false);
  }, [load]);

  const handleReload = useCallback(() => {
    lastDocRef.current = null;
    load(false);
  }, [load]);

  if (error && !rows?.length) {
    return (
      <div className="error-state">
        <p>⚠ Failed to load: {error}</p>
        <button onClick={() => load(false)}>Retry</button>
      </div>
    );
  }

  if (!rows) return <Loader count={3} />;

  if (t === 'scrap') {
    return <Scrapbook items={rows.filter(r => r.image)} />;
  }

  if (!rows.length) {
    return <p className="empty-state">nothing here yet.</p>;
  }

  return (
    <div className="post-list">
      {rows.map((r, i) => (
        <Card
          key={r.id}
          r={r}
          admin={admin}
          onEdit={onEdit}
          reload={handleReload}
          open={SHORT.includes(r.type)}
          index={i}
        />
      ))}
      {hasMore && (
        <button className="load-more-btn" onClick={() => load(true)}>
          load more
        </button>
      )}
    </div>
  );
}
