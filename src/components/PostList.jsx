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
import { PAGE_SIZE } from '../constants';
import { useToast } from './Toast';
import Scrapbook from './Scrapbook';
import Loader from './Loader';

// Thematic section card components
import MovieTicket from './sections/MovieTicket';
import BookCard from './sections/BookCard';
import MusicRecord from './sections/MusicRecord';
import GameCartridge from './sections/GameCartridge';
import PoemNote from './sections/PoemNote';
import BucketDiary from './sections/BucketDiary';
import StickyThought from './sections/StickyThought';
import AirmailLetter from './sections/AirmailLetter';
import RolodexFind from './sections/RolodexFind';
import MetroTimeline from './sections/MetroTimeline';
import QuotePoster from './sections/QuotePoster';
import ProjectBlueprint from './sections/ProjectBlueprint';
import IdBadgeFact from './sections/IdBadgeFact';
import EditorialArticle from './sections/EditorialArticle';

// Dedicated separated section views
import MovieSection from './sections/MovieSection';
import BookSection from './sections/BookSection';
import MusicSection from './sections/MusicSection';
import GameSection from './sections/GameSection';
import BucketSection from './sections/BucketSection';
import PoemSection from './sections/PoemSection';
import ThoughtSection from './sections/ThoughtSection';
import ArchiveSection from './sections/ArchiveSection';
import LetterSection from './sections/LetterSection';

/**
 * Render an entry using its tailored thematic component
 */
export function ThematicCard({ r, admin, onEdit, reload, index }) {
  const card = (() => {
    switch (r.type) {
      case 'review':
        return <MovieTicket r={r} admin={admin} onEdit={onEdit} reload={reload} index={index} />;
      case 'book':
        return <BookCard r={r} admin={admin} onEdit={onEdit} reload={reload} index={index} />;
      case 'music':
        return <MusicRecord r={r} admin={admin} onEdit={onEdit} reload={reload} index={index} />;
      case 'game':
        return <GameCartridge r={r} admin={admin} onEdit={onEdit} reload={reload} index={index} />;
      case 'poem':
        return <PoemNote r={r} admin={admin} onEdit={onEdit} reload={reload} index={index} />;
      case 'bucket':
        return <BucketDiary r={r} admin={admin} onEdit={onEdit} reload={reload} index={index} />;
      case 'thought':
        return <StickyThought r={r} admin={admin} onEdit={onEdit} reload={reload} index={index} />;
      case 'letter':
        return <AirmailLetter r={r} admin={admin} onEdit={onEdit} reload={reload} index={index} />;
      case 'find':
        return <RolodexFind r={r} admin={admin} onEdit={onEdit} reload={reload} index={index} />;
      case 'quote':
        return <QuotePoster r={r} admin={admin} onEdit={onEdit} reload={reload} index={index} />;
      case 'project':
        return <ProjectBlueprint r={r} admin={admin} onEdit={onEdit} reload={reload} index={index} />;
      case 'fact':
        return <IdBadgeFact r={r} admin={admin} onEdit={onEdit} reload={reload} index={index} />;
      default:
        return <EditorialArticle r={r} admin={admin} onEdit={onEdit} reload={reload} index={index} />;
    }
  })();

  if (r.draft && admin) {
    return (
      <div className="draft-entry-wrapper">
        <span className="draft-indicator-tag">🔒 DRAFT (PRIVATE)</span>
        {card}
      </div>
    );
  }

  return card;
}

/**
 * PostList component — routes to the appropriate bespoke layout per theme,
 * filters drafts for non-admins, and supports pagination.
 */
export default function PostList({ t, admin = false, onEdit }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const lastDocRef = useRef(null);
  const toast = useToast();

  const queryLimit = t === 'archive' ? 200 : PAGE_SIZE;

  const buildQuery = useCallback((afterDoc) => {
    const col = collection(db, 'entries');
    const constraints = [];

    if (t === 'archive') {
      constraints.push(orderBy('date', 'desc'));
    } else {
      constraints.push(where('type', '==', t));
      constraints.push(orderBy('date', 'desc'));
    }
    constraints.push(limit(queryLimit));
    if (afterDoc) {
      constraints.push(startAfter(afterDoc));
    }
    return query(col, ...constraints);
  }, [t, queryLimit]);

  const load = useCallback(async (loadMore = false) => {
    try {
      setError(null);
      const q = buildQuery(loadMore ? lastDocRef.current : null);
      const snap = await getDocs(q);
      const entries = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (snap.docs.length > 0) {
        lastDocRef.current = snap.docs[snap.docs.length - 1];
      }
      setHasMore(snap.docs.length >= queryLimit);

      if (loadMore) {
        setRows(prev => [...(prev || []), ...entries]);
      } else {
        setRows(entries);
      }
    } catch (err) {
      setError(err.message);
      toast('Failed to load: ' + err.message, 'error');
      if (!loadMore) setRows([]);
    }
  }, [buildQuery, toast, queryLimit]);

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

  // Filter drafts: public visitors only see published items (draft !== true)
  const visibleRows = admin ? rows : rows.filter(r => !r.draft);

  // 1. Scrapbook: Draggable Collage View
  if (t === 'scrap') {
    return <Scrapbook items={visibleRows.filter(r => r.image)} />;
  }

  // 2. Timeline: Horizontal Metro Subway Track View
  if (t === 'timeline') {
    return (
      <MetroTimeline
        items={visibleRows}
        admin={admin}
        onEdit={onEdit}
        reload={handleReload}
      />
    );
  }

  // 3. Movies: Filterable & Sortable Cinema Ticket Section
  if (t === 'review') {
    return (
      <MovieSection
        items={visibleRows}
        admin={admin}
        onEdit={onEdit}
        reload={handleReload}
      />
    );
  }

  // 4. Books: Library Checkout Card Catalog Section
  if (t === 'book') {
    return (
      <BookSection
        items={visibleRows}
        admin={admin}
        onEdit={onEdit}
        reload={handleReload}
      />
    );
  }

  // 5. Music: Vinyl Records & Mixtapes Crate Section
  if (t === 'music') {
    return (
      <MusicSection
        items={visibleRows}
        admin={admin}
        onEdit={onEdit}
        reload={handleReload}
      />
    );
  }

  // 6. Games: Retro Arcade & Cartridge Shelf Section
  if (t === 'game') {
    return (
      <GameSection
        items={visibleRows}
        admin={admin}
        onEdit={onEdit}
        reload={handleReload}
      />
    );
  }

  // 7. Bucket: Life Ledger & Bucket List Section
  if (t === 'bucket') {
    return (
      <BucketSection
        items={visibleRows}
        admin={admin}
        onEdit={onEdit}
        reload={handleReload}
      />
    );
  }

  // 8. Poems: Typewriter Anthology Desk Section
  if (t === 'poem') {
    return (
      <PoemSection
        items={visibleRows}
        admin={admin}
        onEdit={onEdit}
        reload={handleReload}
      />
    );
  }

  // 9. Thoughts: Corkboard & Sticky Notes Section
  if (t === 'thought') {
    return (
      <ThoughtSection
        items={visibleRows}
        admin={admin}
        onEdit={onEdit}
        reload={handleReload}
      />
    );
  }

  // 10. Letters: Postal Bureau & Airmail Dispatches (Search by Name)
  if (t === 'letter') {
    return (
      <LetterSection
        items={visibleRows}
        admin={admin}
        onEdit={onEdit}
        reload={handleReload}
      />
    );
  }

  // 11. Archive: Dedicated Master Archive Explorer
  if (t === 'archive') {
    return (
      <ArchiveSection
        items={visibleRows}
        admin={admin}
        onEdit={onEdit}
        reload={handleReload}
      />
    );
  }

  if (!visibleRows.length) {
    return <p className="empty-state">nothing here yet.</p>;
  }

  // Fallback for remaining sections (find, quote, project, fact, post, essay, creative, interest)
  const containerClass =
    t === 'find'
      ? 'rolodex-list'
      : t === 'quote'
        ? 'quotes-masonry'
        : t === 'project'
          ? 'projects-workbench-grid'
          : t === 'fact'
            ? 'id-badges-grid'
            : 'editorial-feed';

  return (
    <div className={`thematic-section-wrap ${containerClass}`}>
      {visibleRows.map((r, i) => (
        <ThematicCard
          key={r.id}
          r={r}
          admin={admin}
          onEdit={onEdit}
          reload={handleReload}
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
