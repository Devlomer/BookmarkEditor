import { ArrowDownAZ, ArrowUpZA, CalendarArrowUp, CalendarArrowDown, RotateCcw } from 'lucide-react';
import { useBookmarks } from '../context/BookmarkContext';
import { SortMode } from '../types/bookmark';

const sortOptions: { mode: SortMode; icon: typeof ArrowDownAZ; label: string }[] = [
  { mode: 'az', icon: ArrowDownAZ, label: 'A → Z' },
  { mode: 'za', icon: ArrowUpZA, label: 'Z → A' },
  { mode: 'date-asc', icon: CalendarArrowUp, label: 'Eski → Yeni' },
  { mode: 'date-desc', icon: CalendarArrowDown, label: 'Yeni → Eski' },
];

export default function SortControls() {
  const { state, dispatch } = useBookmarks();

  return (
    <div className="flex items-center gap-1">
      {sortOptions.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => dispatch({ type: 'SET_SORT', payload: state.sortMode === mode ? 'none' : mode })}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
            ${state.sortMode === mode
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:border-slate-600'
            }`}
          title={label}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
      {state.sortMode !== 'none' && (
        <button
          onClick={() => dispatch({ type: 'SET_SORT', payload: 'none' })}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-slate-500 hover:text-white transition-colors"
          title="Sıralamayı sıfırla"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
