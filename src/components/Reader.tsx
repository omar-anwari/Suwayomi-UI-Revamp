import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from 'urql';
import {
  ReaderChapterQuery,
  NextChapterQuery,
  FetchChapterPagesMutation,
  UpdateChapterProgressMutation,
} from '../operations';
import { loadPrefs, savePrefs, type FitMode, type ReadingMode } from '../readerPrefs';
import { BookmarkIcon, MoreVerticalIcon, SettingsIcon, ChevronLeftIcon } from './icons';
import { Spinner } from './ui';

const PRELOAD_CONCURRENCY = 4;
const PROGRESS_DEBOUNCE_MS = 400;

const FIT_CLASS: Record<FitMode, string> = {
  width: 'w-full h-auto',
  height: 'h-[100dvh] w-auto max-w-none',
  original: 'w-auto h-auto max-w-none',
};

const MODE_OPTIONS: [ReadingMode, string][] = [
  ['ltr', 'L → R'],
  ['rtl', 'R → L'],
  ['webtoon', 'Webtoon'],
];
const FIT_OPTIONS: [FitMode, string][] = [
  ['width', 'Width'],
  ['height', 'Height'],
  ['original', 'Original'],
];

function usePagePreloader(pages: string[]): number {
  const [loaded, setLoaded] = useState(0);
  useEffect(() => {
    setLoaded(0);
    if (pages.length === 0) return;
    let cancelled = false;
    let next = 0;
    let active = 0;
    const pump = () => {
      while (!cancelled && active < PRELOAD_CONCURRENCY && next < pages.length) {
        const img = new Image();
        active += 1;
        next += 1;
        const done = () => {
          if (cancelled) return;
          active -= 1;
          setLoaded((n) => n + 1);
          pump();
        };
        img.onload = done;
        img.onerror = done;
        img.src = pages[next - 1];
      }
    };
    pump();
    return () => {
      cancelled = true;
    };
  }, [pages]);
  return loaded;
}

export function Reader() {
  const { chapterId } = useParams();
  return <ReaderView key={chapterId} />;
}

function ReaderView() {
  const { mangaId, chapterId: chapterIdParam } = useParams();
  const chapterId = Number(chapterIdParam);
  const navigate = useNavigate();

  const [prefs, setPrefs] = useState(loadPrefs);
  const setFit = (fit: FitMode) => setPrefs((p) => ({ ...p, fit }));
  const setMode = (mode: ReadingMode) => setPrefs((p) => ({ ...p, mode }));
  useEffect(() => savePrefs(prefs), [prefs]);

  const [uiVisible, setUiVisible] = useState(true);
  const toggleUi = useCallback(() => setUiVisible((v) => !v), []);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [{ data: chapterData }] = useQuery({
    query: ReaderChapterQuery,
    variables: { id: chapterId },
    pause: !Number.isFinite(chapterId),
  });
  const chapter = chapterData?.chapter;

  const [{ data: nextData }] = useQuery({
    query: NextChapterQuery,
    variables: {
      mangaId: chapter?.mangaId ?? 0,
      sourceOrder: (chapter?.sourceOrder ?? -1) + 1,
    },
    pause: !chapter,
  });
  const nextChapter = nextData?.chapters.nodes[0] ?? null;

  const [, fetchPages] = useMutation(FetchChapterPagesMutation);
  const [pages, setPages] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(chapterId)) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setPages([]);
    fetchPages({ chapterId }).then((res) => {
      if (cancelled) return;
      if (res.error) setLoadError(res.error.message);
      else setPages(res.data?.fetchChapterPages?.pages ?? []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [chapterId]);

  const [currentPage, setCurrentPage] = useState(0);
  const initialisedRef = useRef(false);
  useEffect(() => {
    if (initialisedRef.current || !chapter || pages.length === 0) return;
    initialisedRef.current = true;
    const savedPage = prefs.rememberLastChapter ? chapter.lastPageRead : 0;
    setCurrentPage(Math.min(Math.max(savedPage, 0), pages.length - 1));
  }, [chapter, pages.length, prefs.rememberLastChapter]);

  const [, updateProgress] = useMutation(UpdateChapterProgressMutation);
  const lastSentRef = useRef<number>(-1);
  const timerRef = useRef<number | undefined>(undefined);
  const currentPageRef = useRef(0);
  currentPageRef.current = currentPage;

  const send = useCallback(
    (page: number, pageTotal: number) => {
      lastSentRef.current = page;
      const patch: { lastPageRead: number; isRead?: boolean } = { lastPageRead: page };
      if (pageTotal > 0 && page >= pageTotal - 1) patch.isRead = true;
      updateProgress({ id: chapterId, patch });
    },
    [chapterId, updateProgress],
  );

  useEffect(() => {
    if (!initialisedRef.current || pages.length === 0) return;
    const page = Math.min(currentPage, pages.length - 1);
    if (page === lastSentRef.current) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => send(page, pages.length), PROGRESS_DEBOUNCE_MS);
  }, [currentPage, pages.length, send]);

  useEffect(() => {
    return () => {
      window.clearTimeout(timerRef.current);
      const page = Math.min(currentPageRef.current, pages.length - 1);
      if (pages.length > 0 && page !== lastSentRef.current && initialisedRef.current) {
        send(page, pages.length);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages.length]);

  const total = pages.length;
  const goNextChapter = useCallback(() => {
    if (nextChapter && chapter) {
      navigate(`/manga/${chapter.mangaId}/chapter/${nextChapter.id}`, { replace: true });
    }
  }, [nextChapter, chapter, navigate]);

  const goForward = useCallback(() => {
    if (currentPageRef.current >= total) goNextChapter();
    else setCurrentPage((p) => Math.min(p + 1, total));
  }, [total, goNextChapter]);
  const goBackward = useCallback(() => setCurrentPage((p) => Math.max(p - 1, 0)), []);
  const exit = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    else navigate(`/manga/${mangaId}`, { replace: true });
  }, [navigate, mangaId]);
  const toDetail = useCallback(() => navigate(`/manga/${mangaId}`, { replace: true }), [navigate, mangaId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') return exit();
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      if (prefs.mode === 'webtoon') return;
      switch (e.key) {
        case 'ArrowRight':
          prefs.mode === 'rtl' ? goBackward() : goForward();
          break;
        case 'ArrowLeft':
          prefs.mode === 'rtl' ? goForward() : goBackward();
          break;
        case ' ':
        case 'PageDown':
        case 'ArrowDown':
          e.preventDefault();
          goForward();
          break;
        case 'PageUp':
        case 'ArrowUp':
          e.preventDefault();
          goBackward();
          break;
        case 'Home':
          setCurrentPage(0);
          break;
        case 'End':
          setCurrentPage(total - 1);
          break;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prefs.mode, goForward, goBackward, exit, total]);

  const loadedCount = usePagePreloader(pages);
  const loadPct = total > 0 ? Math.round((loadedCount / total) * 100) : 0;

  return (
    <div
      className={`relative h-[100dvh] w-screen overflow-hidden text-zinc-100 ${
        prefs.theme === 'light'
          ? 'bg-white'
          : prefs.theme === 'system'
            ? 'bg-white dark:bg-black'
            : 'bg-black'
      }`}
    >
      {uiVisible && (
        <>
          <Toolbar
            title={chapter?.manga.title}
            subtitle={prefs.showChapterSubtitle ? chapter?.name : undefined}
            loadPct={total > 0 ? loadPct : undefined}
            prefs={prefs}
            onFit={setFit}
            onMode={setMode}
            onExit={exit}
            open={settingsOpen}
            onToggleSettings={() => setSettingsOpen((v) => !v)}
          />
          {total > 0 && loadedCount < total && (
            <div className="pointer-events-none absolute inset-x-0 top-14 z-30 h-0.5 bg-white/10">
              <div
                className="h-full bg-brand-500 transition-[width] duration-200"
                style={{ width: `${loadPct}%` }}
              />
            </div>
          )}
        </>
      )}

      {loadError && (
        <div className="flex h-full items-center justify-center px-6 text-center text-sm text-red-400">
          Failed to load pages: {loadError}
        </div>
      )}

      {!loadError && loading && (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-zinc-500">
          <Spinner className="h-6 w-6" />
          Loading pages…
        </div>
      )}

      {!loadError && !loading && total > 0 && (
        <div className="h-full" style={{ filter: `brightness(${prefs.brightness}%)` }}>
          {prefs.mode === 'webtoon' ? (
            <WebtoonViewer
              pages={pages}
              fit={prefs.fit}
              initialPage={currentPage}
              onPageChange={setCurrentPage}
              onToggleUi={toggleUi}
              endPanel={<EndPanel next={nextChapter} onNext={goNextChapter} onExit={toDetail} />}
            />
          ) : currentPage >= total ? (
            <div className="flex h-full items-center justify-center">
              <EndPanel next={nextChapter} onNext={goNextChapter} onExit={toDetail} />
            </div>
          ) : (
            <PagedViewer
              src={pages[currentPage]}
              fit={prefs.fit}
              mode={prefs.mode}
              onForward={goForward}
              onBackward={goBackward}
              onToggleUi={toggleUi}
            />
          )}
        </div>
      )}

      {uiVisible && !loadError && !loading && total > 0 && prefs.mode !== 'webtoon' && (
        <div className="pb-safe absolute inset-x-0 bottom-0 z-40 border-t border-white/5 bg-black/70 backdrop-blur-xl">
          {prefs.showProgressBar && (
            <div className="px-5 pt-3">
              <p className="mb-2 text-center text-xs font-medium tabular-nums text-zinc-400">
                {Math.min(currentPage, total - 1) + 1} / {total}
              </p>
              <input
                type="range"
                min={0}
                max={Math.max(total - 1, 0)}
                value={Math.min(currentPage, total - 1)}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="manga-range w-full cursor-pointer"
                style={{ '--range-progress': `${total > 1 ? (Math.min(currentPage, total - 1) / (total - 1)) * 100 : 0}%` } as React.CSSProperties}
                aria-label="Page"
              />
            </div>
          )}
          <div className="grid grid-cols-3 pb-1 pt-3">
            <button onClick={goBackward} className="flex flex-col items-center gap-1 py-1 text-zinc-300 transition-colors hover:text-white">
              <ChevronLeftIcon className="h-6 w-6" />
              <span className="text-[11px] font-medium">Previous</span>
            </button>
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              className={`flex flex-col items-center gap-1 py-1 transition-colors ${
                settingsOpen ? 'text-brand-400' : 'text-zinc-300 hover:text-white'
              }`}
            >
              <SettingsIcon className="h-6 w-6" />
              <span className="text-[11px] font-medium">Settings</span>
            </button>
            <button onClick={goForward} className="flex flex-col items-center gap-1 py-1 text-zinc-300 transition-colors hover:text-white">
              <ChevronLeftIcon className="h-6 w-6 rotate-180" />
              <span className="text-[11px] font-medium">Next</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PagedViewer({
  src,
  fit,
  mode,
  onForward,
  onBackward,
  onToggleUi,
}: {
  src: string;
  fit: FitMode;
  mode: ReadingMode;
  onForward: () => void;
  onBackward: () => void;
  onToggleUi: () => void;
}) {
  const leftAction = mode === 'rtl' ? onForward : onBackward;
  const rightAction = mode === 'rtl' ? onBackward : onForward;
  return (
    <div className="flex h-full items-start justify-center overflow-auto">
      <div className="absolute inset-0 z-10 flex">
        <button aria-label="Previous" className="h-full w-[35%]" onClick={leftAction} />
        <button aria-label="Toggle controls" className="h-full w-[30%]" onClick={onToggleUi} />
        <button aria-label="Next" className="h-full w-[35%]" onClick={rightAction} />
      </div>
      <img src={src} alt="" className={`${FIT_CLASS[fit]} select-none`} draggable={false} />
    </div>
  );
}

function WebtoonViewer({
  pages,
  fit,
  initialPage,
  onPageChange,
  onToggleUi,
  endPanel,
}: {
  pages: string[];
  fit: FitMode;
  initialPage: number;
  onPageChange: (page: number) => void;
  onToggleUi: () => void;
  endPanel: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrolledRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ratios = new Map<number, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const idx = Number((e.target as HTMLElement).dataset.index);
          ratios.set(idx, e.intersectionRatio);
        }
        let best = -1;
        let bestRatio = -1;
        ratios.forEach((r, idx) => {
          if (r > bestRatio) {
            bestRatio = r;
            best = idx;
          }
        });
        if (best >= 0) onPageChange(best);
      },
      { root: container, threshold: [0.25, 0.5, 0.75] },
    );
    pageRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [pages.length, onPageChange]);

  useEffect(() => {
    if (scrolledRef.current || initialPage <= 0) return;
    scrolledRef.current = true;
    pageRefs.current[initialPage]?.scrollIntoView();
  }, [initialPage]);

  return (
    <div ref={containerRef} className="h-full overflow-auto" onClick={onToggleUi}>
      <div className="mx-auto flex max-w-3xl flex-col">
        {pages.map((src, i) => (
          <div key={i} data-index={i} ref={(el) => { pageRefs.current[i] = el; }}>
            <img
              src={src}
              alt=""
              loading="lazy"
              className={`${fit === 'width' ? 'w-full' : FIT_CLASS[fit]} mx-auto`}
              draggable={false}
            />
          </div>
        ))}
        {endPanel}
      </div>
    </div>
  );
}

function EndPanel({
  next,
  onNext,
  onExit,
}: {
  next: { name: string; chapterNumber: number } | null;
  onNext: () => void;
  onExit: () => void;
}) {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-sm text-zinc-500">End of chapter</p>
      {next ? (
        <button
          onClick={onNext}
          className="rounded-xl bg-gradient-to-r from-brand-500 to-magenta-500 px-6 py-3 text-sm font-semibold text-on-brand shadow-lg shadow-brand-500/25 transition hover:brightness-110"
        >
          Next: {next.name || `Chapter ${next.chapterNumber}`} →
        </button>
      ) : (
        <>
          <p className="text-zinc-300">You're all caught up.</p>
          <button
            onClick={onExit}
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm text-zinc-200 hover:bg-white/10"
          >
            Back to details
          </button>
        </>
      )}
    </div>
  );
}

function Toolbar({
  title,
  subtitle,
  loadPct,
  prefs,
  onFit,
  onMode,
  onExit,
  open,
  onToggleSettings,
}: {
  title?: string;
  subtitle?: string;
  loadPct?: number;
  prefs: { fit: FitMode; mode: ReadingMode };
  onFit: (f: FitMode) => void;
  onMode: (m: ReadingMode) => void;
  onExit: () => void;
  open: boolean;
  onToggleSettings: () => void;
}) {
  return (
    <div className="pt-safe absolute inset-x-0 top-0 z-40">
      <div className="flex h-16 items-center gap-2 border-b border-white/5 bg-black/80 px-2 backdrop-blur-xl">
        <button
          onClick={onExit}
          className="grid h-10 w-10 place-items-center rounded-full text-zinc-300 hover:bg-white/10"
          title="Back (Esc)"
        >
          <ChevronLeftIcon className="h-6 w-6 -rotate-90" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-semibold text-zinc-100">{subtitle || title || '…'}</p>
          {subtitle && title && <p className="truncate text-[11px] text-zinc-500">{title}</p>}
        </div>
        {loadPct != null && loadPct < 100 && (
          <span className="tabular-nums text-xs text-zinc-500" title="Pages buffered">
            {loadPct}%
          </span>
        )}
        <button className="grid h-10 w-10 place-items-center rounded-full text-zinc-300 hover:bg-white/10" title="Bookmark">
          <BookmarkIcon className="h-5.5 w-5.5" />
        </button>
        <button
          onClick={onToggleSettings}
          className={`grid h-10 w-10 place-items-center rounded-full ${
            open ? 'bg-white/10 text-white' : 'text-zinc-300 hover:bg-white/10'
          }`}
          title="Reader menu"
        >
          <MoreVerticalIcon className="h-5.5 w-5.5" />
        </button>
      </div>

      {open && (
        <div className="absolute right-2 top-[calc(4rem+env(safe-area-inset-top))] w-72 rounded-2xl border border-white/10 bg-surface/98 p-4 shadow-2xl shadow-black/60 backdrop-blur-xl">
          <p className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Reading mode
          </p>
          <Segmented value={prefs.mode} options={MODE_OPTIONS} onChange={onMode} />
          <p className="mt-3 px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Fit
          </p>
          <Segmented value={prefs.fit} options={FIT_OPTIONS} onChange={onFit} />
        </div>
      )}
    </div>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
  return (
    <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-xl bg-white/5 p-1">
      {options.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`rounded-lg px-1 py-1.5 text-xs font-medium transition-colors ${
            value === v
              ? 'bg-gradient-to-r from-brand-500 to-magenta-500 text-on-brand shadow'
              : 'text-zinc-300 hover:bg-white/10'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
