import { useMemo } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useBookmarks } from '../context/BookmarkContext';
import { BookmarkNode, SortMode } from '../types/bookmark';
import BookmarkItem from './BookmarkItem';

function collectAllIds(node: BookmarkNode): string[] {
  const ids: string[] = [node.id];
  if (node.children) {
    for (const child of node.children) {
      ids.push(...collectAllIds(child));
    }
  }
  return ids;
}

function getFilteredIds(node: BookmarkNode, query: string): Set<string> {
  const matchedIds = new Set<string>();
  const lowerQuery = query.toLowerCase();

  function traverse(n: BookmarkNode): boolean {
    const titleMatch = n.title.toLowerCase().includes(lowerQuery);
    const urlMatch = n.url ? n.url.toLowerCase().includes(lowerQuery) : false;
    let childMatch = false;

    if (n.children) {
      for (const child of n.children) {
        if (traverse(child)) {
          childMatch = true;
        }
      }
    }

    if (titleMatch || urlMatch || childMatch) {
      matchedIds.add(n.id);
      return true;
    }
    return false;
  }

  traverse(node);
  return matchedIds;
}

function getSortedChildren(children: BookmarkNode[], sortMode: SortMode): BookmarkNode[] {
  if (sortMode === 'none') return children;
  const sorted = [...children];
  switch (sortMode) {
    case 'az':
      sorted.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
      break;
    case 'za':
      sorted.sort((a, b) => b.title.localeCompare(a.title, 'tr'));
      break;
    case 'date-asc':
      sorted.sort((a, b) => (a.addDate || 0) - (b.addDate || 0));
      break;
    case 'date-desc':
      sorted.sort((a, b) => (b.addDate || 0) - (a.addDate || 0));
      break;
  }
  return sorted;
}

interface BookmarkTreeProps {
  paneId: string;
}

export default function BookmarkTree({ paneId }: BookmarkTreeProps) {
  const { state } = useBookmarks();

  const allIds = useMemo(() => {
    if (!state.root) return [];
    return collectAllIds(state.root);
  }, [state.root]);

  const prefixedIds = useMemo(() => {
    return allIds.map(id => `${paneId}-${id}`);
  }, [allIds, paneId]);

  const filteredIds = useMemo(() => {
    if (!state.root || !state.searchQuery.trim()) return null;
    return getFilteredIds(state.root, state.searchQuery.trim());
  }, [state.root, state.searchQuery]);

  if (!state.root) return null;

  const sortedChildren = getSortedChildren(state.root.children || [], state.sortMode);

  return (
    <SortableContext items={prefixedIds} strategy={verticalListSortingStrategy}>
      <div className="py-1">
        {sortedChildren.map((child) => (
          <BookmarkItem
            key={child.id}
            node={child}
            depth={0}
            filteredIds={filteredIds}
            paneId={paneId}
          />
        ))}
      </div>
    </SortableContext>
  );
}
