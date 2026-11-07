import { ThematicCard } from './PostList';

/**
 * Card wrapper that automatically routes to the theme-specific card.
 */
export default function Card({ r, admin = false, onEdit, reload, open, index = 0 }) {
  return (
    <ThematicCard
      r={r}
      admin={admin}
      onEdit={onEdit}
      reload={reload}
      index={index}
    />
  );
}
