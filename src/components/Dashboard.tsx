import { useState, useCallback } from 'react';
import {
  Download,
  Upload,
  Plus,
  ChevronsDown,
  ChevronsUp,
  Bookmark,
  FolderTree,
  Link2,
  FileText,
  RotateCcw,
  Globe,
  Folder,
  GripVertical,
  Trash2,
  XSquare
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import { useBookmarks } from '../context/BookmarkContext';
import { exportBookmarkHTML } from '../utils/exporter';
import SearchBar from './SearchBar';
import SortControls from './SortControls';
import BookmarkTree from './BookmarkTree';
import AddItemModal from './AddItemModal';
import { BookmarkNode } from '../types/bookmark';

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

export default function Dashboard() {
  const { state, dispatch, getStats } = useBookmarks();
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeNode, setActiveNode] = useState<BookmarkNode | null>(null);
  const stats = getStats();

  const handleExport = useCallback(() => {
    if (!state.root) return;
    const html = exportBookmarkHTML(state.root);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = state.fileName.replace('.html', '_edited.html') || 'bookmarks_edited.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.root, state.fileName]);

  const handleReset = useCallback(() => {
    if (confirm('Tüm değişiklikler silinecek. Emin misiniz?')) {
      dispatch({ type: 'RESET' });
    }
  }, [dispatch]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (!state.root) return;
    // id could be prefixed like "left-123", we extract the real id
    const dragId = String(event.active.id).split('-').slice(1).join('-');
    const node = findNodeById(state.root, dragId);
    setActiveNode(node);
  }, [state.root]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveNode(null);

    if (!over || active.id === over.id) return;

    const activeId = String(active.id).split('-').slice(1).join('-');
    const overId = String(over.id).split('-').slice(1).join('-');

    if (activeId === overId) return;

    const overNode = state.root ? findNodeById(state.root, overId) : null;
    const position = overNode?.type === 'folder' ? 'inside' : 'after';

    dispatch({
      type: 'MOVE_NODE',
      payload: {
        activeId,
        overId,
        position,
      },
    });
  }, [state.root, dispatch]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-screen bg-slate-900">
        {/* Compact Header */}
        <header className="shrink-0 z-40 bg-slate-900 border-b border-slate-800">
          <div className="mx-auto px-4 py-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-7 h-7 rounded bg-blue-500/20">
                    <Bookmark className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-white leading-none">Bookmark Editor</h1>
                    <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <FileText className="w-2.5 h-2.5" />
                      {state.fileName}
                      {state.isDirty && <span className="text-amber-400 ml-1">• Düzenlendi</span>}
                    </p>
                  </div>
                </div>
                {/* Compact Stats */}
                <div className="hidden md:flex items-center gap-3 ml-4 bg-slate-800/50 rounded-lg px-3 py-1 border border-slate-700/50">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <FolderTree className="w-3.5 h-3.5 text-amber-400" /> {stats.folders}
                  </div>
                  <div className="w-px h-3 bg-slate-700" />
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <Link2 className="w-3.5 h-3.5 text-blue-400" /> {stats.links}
                  </div>
                  <div className="w-px h-3 bg-slate-700" />
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    {stats.total} Toplam
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-400 rounded-md text-xs font-medium hover:text-white hover:bg-slate-700 border border-slate-700 transition-all"
                  title="Yeni dosya yükle"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Yeni</span>
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Dışa Aktar</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col p-4 overflow-hidden gap-3">
          {/* Toolbar */}
          <div className="shrink-0 bg-slate-800/40 border border-slate-700/50 rounded-lg p-2.5">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex-1 min-w-[200px]">
                <SearchBar />
              </div>

              {/* Selection Toolbar */}
              {state.selectedIds.size > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg animate-in fade-in zoom-in-95 duration-200">
                  <span className="text-xs font-medium text-blue-400">
                    {state.selectedIds.size} seçili
                  </span>
                  <div className="w-px h-4 bg-blue-500/30 mx-1" />
                  <button
                    onClick={() => dispatch({ type: 'DELETE_SELECTED' })}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Sil
                  </button>
                  <button
                    onClick={() => dispatch({ type: 'CLEAR_SELECTION' })}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors ml-1"
                  >
                    <XSquare className="w-3.5 h-3.5" /> İptal
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <SortControls />
                <div className="w-px h-5 bg-slate-700 hidden sm:block" />
                <button
                  onClick={() => dispatch({ type: 'EXPAND_ALL' })}
                  className="flex items-center gap-1 p-1.5 rounded-md text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:border-slate-600 transition-all"
                  title="Tümünü aç"
                >
                  <ChevronsDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => dispatch({ type: 'COLLAPSE_ALL' })}
                  className="flex items-center gap-1 p-1.5 rounded-md text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:border-slate-600 transition-all"
                  title="Tümünü kapat"
                >
                  <ChevronsUp className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-5 bg-slate-700 hidden sm:block" />
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ekle
                </button>
              </div>
            </div>
          </div>

          {/* Dual Pane Trees */}
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Pane */}
            <div className="flex flex-col bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden shadow-lg">
              <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-slate-700/50 bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-white truncate max-w-[200px]">Sol Panel</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                <BookmarkTree paneId="left" />
              </div>
            </div>

            {/* Right Pane */}
            <div className="hidden md:flex flex-col bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden shadow-lg">
              <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-slate-700/50 bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-white truncate max-w-[200px]">Sağ Panel</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                <BookmarkTree paneId="right" />
              </div>
            </div>
          </div>

          {/* Footer hint */}
          <div className="shrink-0 flex items-center justify-center gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1 text-slate-400">
              <RotateCcw className="w-3 h-3" />
              Paneller arası sürükle & bırak
            </span>
            <span className="hidden sm:inline">• Düzenlemek için kalem ikonuna tıkla</span>
            <span className="hidden sm:inline">• Seçim kutucuğuyla çoklu işlem yap</span>
          </div>
        </div>

        {/* Add Modal */}
        {showAddModal && state.root && (
          <AddItemModal
            parentId={state.root.id}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </div>

      <DragOverlay>
        {activeNode ? (
          <div className="flex items-center gap-2 bg-slate-800 border border-blue-500/40 rounded-lg px-3 py-2 shadow-2xl shadow-blue-500/10">
            <GripVertical className="w-3.5 h-3.5 text-slate-500" />
            {activeNode.type === 'folder' ? (
              <Folder className="w-4 h-4 text-amber-400" />
            ) : (
              <Globe className="w-4 h-4 text-blue-400" />
            )}
            <span className="text-sm text-white font-medium truncate max-w-[200px]">
              {state.selectedIds.has(activeNode.id) && state.selectedIds.size > 1 ? 
                `${state.selectedIds.size} öğe taşınıyor` : 
                activeNode.title}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
