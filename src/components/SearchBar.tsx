import { Search, X } from 'lucide-react';
import { useBookmarks } from '../context/BookmarkContext';

export default function SearchBar() {
  const { state, dispatch } = useBookmarks();

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        placeholder="Link adı veya URL ara..."
        value={state.searchQuery}
        onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-9 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
      />
      {state.searchQuery && (
        <button
          onClick={() => dispatch({ type: 'SET_SEARCH', payload: '' })}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
