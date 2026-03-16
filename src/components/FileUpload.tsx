import { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { useBookmarks } from '../context/BookmarkContext';
import { parseBookmarkHTML, resetIdCounter } from '../utils/parser';

export default function FileUpload() {
  const { dispatch } = useBookmarks();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    setError(null);
    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      setError('Lütfen bir HTML dosyası seçin (.html veya .htm)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (!content.includes('NETSCAPE-Bookmark') && !content.includes('<DL') && !content.includes('<dl')) {
          setError('Bu dosya geçerli bir Netscape Bookmark dosyası değil gibi görünüyor.');
          return;
        }
        resetIdCounter();
        const root = parseBookmarkHTML(content);
        dispatch({ type: 'SET_ROOT', payload: { root, fileName: file.name } });
      } catch (err) {
        setError('Dosya parse edilirken bir hata oluştu. Lütfen geçerli bir bookmark dosyası seçin.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  }, [dispatch]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const loadDemo = useCallback(() => {
    const demoHTML = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="1609459200" LAST_MODIFIED="1609459200">Bookmark Bar</H3>
    <DL><p>
        <DT><H3 ADD_DATE="1609459200" LAST_MODIFIED="1609459200">Geliştirme</H3>
        <DL><p>
            <DT><A HREF="https://github.com" ADD_DATE="1609459200">GitHub</A>
            <DT><A HREF="https://stackoverflow.com" ADD_DATE="1609459300">Stack Overflow</A>
            <DT><A HREF="https://developer.mozilla.org" ADD_DATE="1609459400">MDN Web Docs</A>
            <DT><H3 ADD_DATE="1609459200">Frontend</H3>
            <DL><p>
                <DT><A HREF="https://react.dev" ADD_DATE="1609459500">React</A>
                <DT><A HREF="https://vuejs.org" ADD_DATE="1609459600">Vue.js</A>
                <DT><A HREF="https://tailwindcss.com" ADD_DATE="1609459700">Tailwind CSS</A>
                <DT><A HREF="https://nextjs.org" ADD_DATE="1609459800">Next.js</A>
            </DL><p>
            <DT><H3 ADD_DATE="1609459200">Backend</H3>
            <DL><p>
                <DT><A HREF="https://nodejs.org" ADD_DATE="1609460000">Node.js</A>
                <DT><A HREF="https://expressjs.com" ADD_DATE="1609460100">Express.js</A>
                <DT><A HREF="https://www.python.org" ADD_DATE="1609460200">Python</A>
            </DL><p>
        </DL><p>
        <DT><H3 ADD_DATE="1609459200" LAST_MODIFIED="1609459200">Tasarım</H3>
        <DL><p>
            <DT><A HREF="https://figma.com" ADD_DATE="1609460300">Figma</A>
            <DT><A HREF="https://dribbble.com" ADD_DATE="1609460400">Dribbble</A>
            <DT><A HREF="https://behance.net" ADD_DATE="1609460500">Behance</A>
            <DT><A HREF="https://coolors.co" ADD_DATE="1609460600">Coolors</A>
        </DL><p>
        <DT><H3 ADD_DATE="1609459200">Araçlar</H3>
        <DL><p>
            <DT><A HREF="https://notion.so" ADD_DATE="1609460700">Notion</A>
            <DT><A HREF="https://trello.com" ADD_DATE="1609460800">Trello</A>
            <DT><A HREF="https://slack.com" ADD_DATE="1609460900">Slack</A>
        </DL><p>
        <DT><A HREF="https://www.google.com" ADD_DATE="1609461000">Google</A>
        <DT><A HREF="https://www.youtube.com" ADD_DATE="1609461100">YouTube</A>
    </DL><p>
    <DT><H3 ADD_DATE="1609459200">Diğer Yer İşaretleri</H3>
    <DL><p>
        <DT><A HREF="https://medium.com" ADD_DATE="1609461200">Medium</A>
        <DT><A HREF="https://dev.to" ADD_DATE="1609461300">DEV Community</A>
        <DT><A HREF="https://news.ycombinator.com" ADD_DATE="1609461400">Hacker News</A>
        <DT><A HREF="https://reddit.com" ADD_DATE="1609461500">Reddit</A>
    </DL><p>
</DL><p>`;
    resetIdCounter();
    const root = parseBookmarkHTML(demoHTML);
    dispatch({ type: 'SET_ROOT', payload: { root, fileName: 'demo_bookmarks.html' } });
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/20 mb-4">
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Bookmark Editor</h1>
          <p className="text-slate-400 text-base">
            Chrome yer işaretlerinizi düzenleyin, sıralayın ve yeniden dışa aktarın
          </p>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer
            ${dragActive
              ? 'border-blue-400 bg-blue-500/10 scale-[1.02]'
              : 'border-slate-600 bg-slate-800/50 hover:border-blue-500/50 hover:bg-slate-800/80'
            }`}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".html,.htm"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload className={`w-10 h-10 mx-auto mb-4 transition-colors ${dragActive ? 'text-blue-400' : 'text-slate-500'}`} />
          <p className="text-white font-medium text-lg mb-1">
            Bookmark dosyanızı sürükleyip bırakın
          </p>
          <p className="text-slate-400 text-sm">
            veya seçmek için tıklayın • <span className="text-slate-500">.html / .htm</span>
          </p>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={loadDemo}
            className="text-sm text-slate-500 hover:text-blue-400 transition-colors underline underline-offset-4"
          >
            Demo verilerle dene →
          </button>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Sürükle & Bırak', desc: 'Kolay düzenleme' },
            { label: 'Arama & Filtre', desc: 'Hızlı bulma' },
            { label: 'Dışa Aktar', desc: 'Chrome uyumlu' },
          ].map((item) => (
            <div key={item.label} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
              <p className="text-white font-medium text-sm">{item.label}</p>
              <p className="text-slate-500 text-xs mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
