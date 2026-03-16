export interface BookmarkNode {
  id: string;
  type: 'folder' | 'link' | 'separator';
  title: string;
  url?: string;
  addDate?: number;
  lastModified?: number;
  icon?: string;
  children?: BookmarkNode[];
}

export type SortMode = 'none' | 'az' | 'za' | 'date-asc' | 'date-desc';

export interface BookmarkState {
  root: BookmarkNode | null;
  searchQuery: string;
  sortMode: SortMode;
  expandedFolders: Set<string>;
  editingNode: BookmarkNode | null;
  isDirty: boolean;
  fileName: string;
}
