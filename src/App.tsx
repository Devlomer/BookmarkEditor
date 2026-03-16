import { BookmarkProvider, useBookmarks } from './context/BookmarkContext';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';

function AppContent() {
  const { state } = useBookmarks();

  if (!state.root) {
    return <FileUpload />;
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <BookmarkProvider>
      <AppContent />
    </BookmarkProvider>
  );
}
