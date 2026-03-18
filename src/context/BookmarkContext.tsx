import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import { BookmarkNode, SortMode } from '../types/bookmark';
import { generateNewId } from '../utils/parser';

interface BookmarkState {
  root: BookmarkNode | null;
  searchQuery: string;
  sortMode: SortMode;
  expandedFolders: Set<string>;
  editingNode: BookmarkNode | null;
  isDirty: boolean;
  fileName: string;
  selectedIds: Set<string>;
}

type Action =
  | { type: 'SET_ROOT'; payload: { root: BookmarkNode; fileName: string } }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_SORT'; payload: SortMode }
  | { type: 'TOGGLE_FOLDER'; payload: { id: string; paneId: string } }
  | { type: 'EXPAND_ALL' }
  | { type: 'COLLAPSE_ALL' }
  | { type: 'SET_EDITING'; payload: BookmarkNode | null }
  | { type: 'UPDATE_NODE'; payload: { id: string; title: string; url?: string } }
  | { type: 'DELETE_NODE'; payload: string }
  | { type: 'MOVE_NODE'; payload: { activeId: string; overId: string; position: 'before' | 'after' | 'inside' } }
  | { type: 'ADD_FOLDER'; payload: { parentId: string; title: string } }
  | { type: 'ADD_LINK'; payload: { parentId: string; title: string; url: string } }
  | { type: 'TOGGLE_SELECT'; payload: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'DELETE_SELECTED' }
  | { type: 'RESET' };

function getAllFolderIds(node: BookmarkNode): string[] {
  const ids: string[] = [];
  if (node.type === 'folder') {
    ids.push(node.id);
    node.children?.forEach(child => {
      ids.push(...getAllFolderIds(child));
    });
  }
  return ids;
}

function updateNodeInTree(node: BookmarkNode, id: string, updater: (n: BookmarkNode) => BookmarkNode): BookmarkNode {
  if (node.id === id) {
    return updater(node);
  }
  if (node.children) {
    return {
      ...node,
      children: node.children.map(child => updateNodeInTree(child, id, updater)),
    };
  }
  return node;
}

function deleteNodeFromTree(node: BookmarkNode, id: string): BookmarkNode {
  if (node.children) {
    return {
      ...node,
      children: node.children
        .filter(child => child.id !== id)
        .map(child => deleteNodeFromTree(child, id)),
    };
  }
  return node;
}

function findNodeById(node: BookmarkNode, id: string): BookmarkNode | null {
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
}

function findParentNode(root: BookmarkNode, targetId: string): BookmarkNode | null {
  if (root.children) {
    for (const child of root.children) {
      if (child.id === targetId) return root;
      const found = findParentNode(child, targetId);
      if (found) return found;
    }
  }
  return null;
}

function moveNodesInTree(
  root: BookmarkNode,
  activeIds: string[],
  overId: string,
  position: 'before' | 'after' | 'inside'
): BookmarkNode {
  const nodesToMove: BookmarkNode[] = [];
  for (const id of activeIds) {
    const node = findNodeById(root, id);
    if (node) nodesToMove.push(JSON.parse(JSON.stringify(node))); // clone
  }

  // Check prevent circular
  for (const node of nodesToMove) {
    if (node.id === overId || (node.type === 'folder' && findNodeById(node, overId))) {
      return root; // Invalid move
    }
  }

  // Remove all activeIds from the tree
  let newRoot = root;
  for (const id of activeIds) {
    newRoot = deleteNodeFromTree(newRoot, id);
  }

  // Insert nodesToMove
  if (position === 'inside') {
    newRoot = updateNodeInTree(newRoot, overId, (n) => ({
      ...n,
      children: [...(n.children || []), ...nodesToMove],
    }));
  } else {
    const parent = findParentNode(newRoot, overId);
    if (parent && parent.children) {
      const idx = parent.children.findIndex(c => c.id === overId);
      if (idx !== -1) {
        const insertIdx = position === 'after' ? idx + 1 : idx;
        const newChildren = [...parent.children];
        newChildren.splice(insertIdx, 0, ...nodesToMove);
        newRoot = updateNodeInTree(newRoot, parent.id, (n) => ({
          ...n,
          children: newChildren,
        }));
      }
    }
  }

  return newRoot;
}

function reducer(state: BookmarkState, action: Action): BookmarkState {
  switch (action.type) {
    case 'SET_ROOT': {
      const allIds = getAllFolderIds(action.payload.root);
      const initialExpanded = new Set<string>();
      allIds.slice(0, 5).forEach(id => {
        initialExpanded.add(`left-${id}`);
        initialExpanded.add(`right-${id}`);
      });
      // Expand first two levels
      return {
        ...state,
        root: action.payload.root,
        fileName: action.payload.fileName,
        isDirty: false,
        expandedFolders: initialExpanded,
        searchQuery: '',
        sortMode: 'none',
        selectedIds: new Set(),
      };
    }
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };
    case 'SET_SORT':
      return { ...state, sortMode: action.payload };
    case 'TOGGLE_FOLDER': {
      const newSet = new Set(state.expandedFolders);
      const key = `${action.payload.paneId}-${action.payload.id}`;
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return { ...state, expandedFolders: newSet };
    }
    case 'EXPAND_ALL': {
      if (!state.root) return state;
      const allIds = getAllFolderIds(state.root);
      const newExpanded = new Set<string>();
      allIds.forEach(id => {
        newExpanded.add(`left-${id}`);
        newExpanded.add(`right-${id}`);
      });
      return { ...state, expandedFolders: newExpanded };
    }
    case 'COLLAPSE_ALL':
      return { ...state, expandedFolders: new Set() };
    case 'SET_EDITING':
      return { ...state, editingNode: action.payload };
    case 'UPDATE_NODE': {
      if (!state.root) return state;
      return {
        ...state,
        isDirty: true,
        editingNode: null,
        root: updateNodeInTree(state.root, action.payload.id, (n) => ({
          ...n,
          title: action.payload.title,
          url: action.payload.url ?? n.url,
        })),
      };
    }
    case 'DELETE_NODE': {
      if (!state.root) return state;
      const newSelected = new Set(state.selectedIds);
      newSelected.delete(action.payload);
      return {
        ...state,
        isDirty: true,
        root: deleteNodeFromTree(state.root, action.payload),
        selectedIds: newSelected,
      };
    }
    case 'MOVE_NODE': {
      if (!state.root) return state;
      const { activeId, overId, position } = action.payload;
      let idsToMove = [activeId];
      
      if (state.selectedIds.has(activeId)) {
        idsToMove = Array.from(state.selectedIds);
      }

      return {
        ...state,
        isDirty: true,
        root: moveNodesInTree(
          state.root,
          idsToMove,
          overId,
          position
        ),
      };
    }
    case 'ADD_FOLDER': {
      if (!state.root) return state;
      const newFolder: BookmarkNode = {
        id: generateNewId(),
        type: 'folder',
        title: action.payload.title,
        addDate: Math.floor(Date.now() / 1000),
        children: [],
      };
      return {
        ...state,
        isDirty: true,
        root: updateNodeInTree(state.root, action.payload.parentId, (n) => ({
          ...n,
          children: [...(n.children || []), newFolder],
        })),
      };
    }
    case 'ADD_LINK': {
      if (!state.root) return state;
      const newLink: BookmarkNode = {
        id: generateNewId(),
        type: 'link',
        title: action.payload.title,
        url: action.payload.url,
        addDate: Math.floor(Date.now() / 1000),
      };
      return {
        ...state,
        isDirty: true,
        root: updateNodeInTree(state.root, action.payload.parentId, (n) => ({
          ...n,
          children: [...(n.children || []), newLink],
        })),
      };
    }
    case 'TOGGLE_SELECT': {
      const newSet = new Set(state.selectedIds);
      if (newSet.has(action.payload)) {
        newSet.delete(action.payload);
      } else {
        newSet.add(action.payload);
      }
      return { ...state, selectedIds: newSet };
    }
    case 'CLEAR_SELECTION':
      return { ...state, selectedIds: new Set() };
    case 'DELETE_SELECTED': {
      if (!state.root || state.selectedIds.size === 0) return state;
      let newRoot = state.root;
      state.selectedIds.forEach(id => {
        newRoot = deleteNodeFromTree(newRoot, id);
      });
      return {
        ...state,
        isDirty: true,
        root: newRoot,
        selectedIds: new Set(),
      };
    }
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const initialState: BookmarkState = {
  root: null,
  searchQuery: '',
  sortMode: 'none',
  expandedFolders: new Set(),
  editingNode: null,
  isDirty: false,
  fileName: '',
  selectedIds: new Set(),
};

interface BookmarkContextType {
  state: BookmarkState;
  dispatch: React.Dispatch<Action>;
  getStats: () => { folders: number; links: number; total: number };
}

const BookmarkContext = createContext<BookmarkContextType | null>(null);

function countNodes(node: BookmarkNode): { folders: number; links: number } {
  let folders = 0;
  let links = 0;
  if (node.type === 'folder') {
    folders++;
    node.children?.forEach(child => {
      const sub = countNodes(child);
      folders += sub.folders;
      links += sub.links;
    });
  } else if (node.type === 'link') {
    links++;
  }
  return { folders, links };
}

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const getStats = useCallback(() => {
    if (!state.root) return { folders: 0, links: 0, total: 0 };
    const { folders, links } = countNodes(state.root);
    return { folders: folders - 1, links, total: folders - 1 + links }; // -1 for root
  }, [state.root]);

  return (
    <BookmarkContext.Provider value={{ state, dispatch, getStats }}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const ctx = useContext(BookmarkContext);
  if (!ctx) throw new Error('useBookmarks must be used within BookmarkProvider');
  return ctx;
}
