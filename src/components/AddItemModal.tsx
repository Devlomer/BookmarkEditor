import { useState } from 'react';
import { X, FolderPlus, Link } from 'lucide-react';
import { useBookmarks } from '../context/BookmarkContext';
import { BookmarkNode } from '../types/bookmark';

interface AddItemModalProps {
  parentId: string;
  onClose: () => void;
}

function getAllFolders(node: BookmarkNode, depth: number = 0): { node: BookmarkNode; depth: number }[] {
  const result: { node: BookmarkNode; depth: number }[] = [];
  if (node.type === 'folder') {
    result.push({ node, depth });
    node.children?.forEach(child => {
      result.push(...getAllFolders(child, depth + 1));
    });
  }
  return result;
}

export default function AddItemModal({ parentId, onClose }: AddItemModalProps) {
  const { state, dispatch } = useBookmarks();
  const [mode, setMode] = useState<'folder' | 'link'>('link');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('https://');
  const [selectedParent, setSelectedParent] = useState(parentId);

  const folders = state.root ? getAllFolders(state.root) : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (mode === 'folder') {
      dispatch({ type: 'ADD_FOLDER', payload: { parentId: selectedParent, title: title.trim() } });
    } else {
      dispatch({ type: 'ADD_LINK', payload: { parentId: selectedParent, title: title.trim(), url: url.trim() } });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Yeni Öğe Ekle</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type selector */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('link')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all
                ${mode === 'link'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-700/50 text-slate-400 border border-slate-700 hover:text-white'
                }`}
            >
              <Link className="w-4 h-4" /> Link
            </button>
            <button
              type="button"
              onClick={() => setMode('folder')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all
                ${mode === 'folder'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-700/50 text-slate-400 border border-slate-700 hover:text-white'
                }`}
            >
              <FolderPlus className="w-4 h-4" /> Klasör
            </button>
          </div>

          {/* Parent folder */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Hedef Klasör</label>
            <select
              value={selectedParent}
              onChange={(e) => setSelectedParent(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {folders.map(({ node, depth }) => (
                <option key={node.id} value={node.id}>
                  {'  '.repeat(depth)}{depth > 0 ? '└ ' : ''}{node.title}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Başlık</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder={mode === 'folder' ? 'Klasör adı' : 'Link başlığı'}
              autoFocus
            />
          </div>

          {/* URL (only for links) */}
          {mode === 'link' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono"
                placeholder="https://example.com"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Ekle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
