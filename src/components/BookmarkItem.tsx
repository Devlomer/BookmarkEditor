import { useState, useRef, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Globe,
  Pencil,
  Trash2,
  GripVertical,
  Check,
  X,
  ExternalLink,
  CheckSquare,
  Square,
} from 'lucide-react';
import { BookmarkNode } from '../types/bookmark';
import { useBookmarks } from '../context/BookmarkContext';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface BookmarkItemProps {
  node: BookmarkNode;
  depth: number;
  filteredIds?: Set<string> | null;
  paneId: string;
}

export default function BookmarkItem({ node, depth, filteredIds, paneId }: BookmarkItemProps) {
  const { state, dispatch } = useBookmarks();
  const isSelected = state.selectedIds.has(node.id);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const [editUrl, setEditUrl] = useState(node.url || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const isExpanded = state.expandedFolders.has(node.id);
  const isFolder = node.type === 'folder';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `${paneId}-${node.id}`,
    data: { node, depth, paneId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editTitle.trim()) {
      dispatch({
        type: 'UPDATE_NODE',
        payload: { id: node.id, title: editTitle.trim(), url: editUrl.trim() || undefined },
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(node.title);
    setEditUrl(node.url || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  const handleDelete = () => {
    dispatch({ type: 'DELETE_NODE', payload: node.id });
    setShowDeleteConfirm(false);
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return null;
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getFavicon = (url?: string) => {
    if (!url) return null;
    try {
      const u = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=16`;
    } catch {
      return null;
    }
  };

  if (node.type === 'separator') {
    return <hr className="border-slate-700/50 my-1 mx-4" />;
  }

  // Filter logic - if search active and this node doesn't match, hide it
  if (filteredIds && !filteredIds.has(node.id)) {
    return null;
  }

  const childCount = isFolder ? (node.children?.length || 0) : 0;

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`group flex items-center gap-1 py-1 px-2 mx-1 rounded-lg transition-all duration-100
          ${isDragging ? 'bg-blue-500/20 ring-1 ring-blue-500/40' : isSelected ? 'bg-blue-500/10' : 'hover:bg-slate-700/40'}
          ${isEditing ? 'bg-slate-700/60 ring-1 ring-blue-500/30' : ''}
        `}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 transition-opacity shrink-0"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        {/* Selection Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            dispatch({ type: 'TOGGLE_SELECT', payload: node.id });
          }}
          className="shrink-0 transition-colors p-0.5"
          title="Seç"
        >
          {isSelected ? (
            <CheckSquare className="w-4 h-4 text-blue-500" />
          ) : (
            <Square className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>

        {/* Expand/collapse for folders */}
        {isFolder ? (
          <button
            onClick={() => dispatch({ type: 'TOGGLE_FOLDER', payload: node.id })}
            className="shrink-0 text-slate-500 hover:text-white transition-colors p-0.5"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <span className="w-[18px] shrink-0" />
        )}

        {/* Icon */}
        <span className="shrink-0">
          {isFolder ? (
            isExpanded ? (
              <FolderOpen className="w-4 h-4 text-amber-400" />
            ) : (
              <Folder className="w-4 h-4 text-amber-500" />
            )
          ) : (
            <>
              {node.icon ? (
                <img src={node.icon} alt="" className="w-4 h-4" onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }} />
              ) : null}
              {getFavicon(node.url) && !node.icon ? (
                <img src={getFavicon(node.url)!} alt="" className="w-4 h-4" onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }} />
              ) : !node.icon ? (
                <Globe className="w-4 h-4 text-blue-400" />
              ) : null}
              {node.icon && <Globe className="w-4 h-4 text-blue-400 hidden" />}
            </>
          )}
        </span>

        {/* Content */}
        {isEditing ? (
          <div className="flex-1 flex flex-col gap-1.5 ml-1.5 min-w-0">
            <input
              ref={titleInputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
              placeholder="Başlık"
            />
            {!isFolder && (
              <input
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full font-mono"
                placeholder="URL"
              />
            )}
            <div className="flex gap-1.5">
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 transition-colors"
              >
                <Check className="w-3 h-3" /> Kaydet
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 px-2 py-0.5 bg-slate-700 text-slate-400 rounded text-xs hover:bg-slate-600 transition-colors"
              >
                <X className="w-3 h-3" /> İptal
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-2 min-w-0 ml-1.5">
            <span className="text-sm text-white truncate font-medium">
              {node.title}
            </span>
            {isFolder && childCount > 0 && (
              <span className="shrink-0 text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full font-medium">
                {childCount}
              </span>
            )}
            {!isFolder && node.url && (
              <span className="text-xs text-slate-500 truncate hidden sm:inline font-mono">
                {node.url.length > 50 ? node.url.slice(0, 50) + '...' : node.url}
              </span>
            )}
            {node.addDate && (
              <span className="shrink-0 text-[10px] text-slate-600 hidden lg:inline">
                {formatDate(node.addDate)}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        {!isEditing && (
          <div className="shrink-0 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
            {!isFolder && node.url && (
              <a
                href={node.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-slate-500 hover:text-blue-400 transition-colors rounded"
                title="Linki aç"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
              className="p-1 text-slate-500 hover:text-yellow-400 transition-colors rounded"
              title="Düzenle"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-1 bg-red-500/10 rounded px-1">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                  className="p-1 text-red-400 hover:text-red-300 text-xs font-medium"
                >
                  Sil
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                  className="p-1 text-slate-500 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                className="p-1 text-slate-500 hover:text-red-400 transition-colors rounded"
                title="Sil"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Children */}
      {isFolder && isExpanded && node.children && node.children.length > 0 && (
        <div>
          {getSortedChildren(node.children, state.sortMode).map((child) => (
            <BookmarkItem
              key={child.id}
              node={child}
              depth={depth + 1}
              filteredIds={filteredIds}
              paneId={paneId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function getSortedChildren(children: BookmarkNode[], sortMode: string): BookmarkNode[] {
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
