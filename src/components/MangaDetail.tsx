import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from 'urql';
import {
  MangaDetailQuery,
  MangaChaptersQuery,
  UpdateMangaLibraryMutation,
  FetchMangaAndChaptersMutation,
} from '../operations';
import { mangaStatusLabel, formatEpochMs, chapterLabel } from '../format';
import { Chip, Skeleton, LoadMoreButton, ErrorState } from './ui';
import {
  BookOpenIcon,
  ChevronLeftIcon,
  BookmarkIcon,
  HomeIcon,
  CompassIcon,
  LibraryIcon,
  MoreVerticalIcon,
  ShareIcon,
  StarIcon,
  UserIcon,
} from './icons';

const CHAPTER_PAGE = 100;

export function MangaDetail() {
  const { id } = useParams();
  return <MangaDetailView key={id} />;
}

function MangaDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mangaId = Number(id);

  const [{ data, fetching, error }, reexecuteDetail] = useQuery({
    query: MangaDetailQuery,
    variables: { id: mangaId },
    pause: !Number.isFinite(mangaId),
  });
  const manga = data?.manga;

  const [, fetchMangaChapters] = useMutation(FetchMangaAndChaptersMutation);
  const [initializing, setInitializing] = useState(false);
  const initRef = useRef(false);
  useEffect(() => {
    if (!manga || initRef.current) return;
    if (manga.initialized) {
      initRef.current = true;
      return;
    }
    initRef.current = true;
    setInitializing(true);
    fetchMangaChapters({ id: mangaId }).then(() => {
      setInitializing(false);
      reexecuteDetail({ requestPolicy: 'network-only' });
    });
  }, [manga, mangaId, fetchMangaChapters, reexecuteDetail]);

  const [savedOverride, setSavedOverride] = useState<boolean | null>(null);
  const [, updateLibrary] = useMutation(UpdateMangaLibraryMutation);
  const inLibrary = savedOverride ?? manga?.inLibrary ?? false;
  async function toggleLibrary() {
    if (!manga) return;
    const next = !inLibrary;
    setSavedOverride(next);
    const res = await updateLibrary({ id: mangaId, inLibrary: next });
    if (res.error) setSavedOverride(!next);
  }

  return (
    <div className="relative min-h-dvh bg-[#030509] pb-20 md:pb-0">
      <div className="absolute inset-x-0 top-0 hidden h-[62vh] sm:block sm:h-[68vh]">
        {manga?.thumbnailUrl && (
          <img src={manga.thumbnailUrl} alt="" className="h-full w-full object-cover object-top opacity-35 blur-sm" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030509]/40 via-[#030509]/55 to-[#030509]" />
      </div>

      <div className="pt-safe absolute inset-x-0 top-0 z-20">
        <div className="flex h-14 items-center justify-between px-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="grid h-10 w-10 place-items-center rounded-full bg-black/30 text-white backdrop-blur transition-colors hover:bg-black/50"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-1.5">
            <button className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/30 text-white backdrop-blur" aria-label="Share">
              <ShareIcon className="h-5 w-5" />
            </button>
            {manga?.realUrl && (
              <a
                href={manga.realUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Open source page"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/30 text-white backdrop-blur transition-colors hover:bg-black/50"
              >
                <MoreVerticalIcon className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {error && <ErrorState message={`Failed to load: ${error.message}`} />}

      <div className="relative z-10 mx-auto max-w-3xl px-4 pt-20 sm:px-6 sm:pt-[34vh]">
        {!manga && fetching && <DetailSkeleton />}

        {manga && (
          <>
            <div className="flex gap-5 sm:gap-6">
              <div className="w-[45%] max-w-48 shrink-0 sm:w-40">
                <div className="aspect-2/3 overflow-hidden rounded-xl bg-zinc-800 shadow-2xl shadow-black/60 ring-1 ring-white/10 sm:rounded-2xl">
                  {manga.thumbnailUrl && (
                    <img
                      src={manga.thumbnailUrl}
                      alt={manga.title}
                      fetchPriority="high"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              </div>

              <div className="min-w-0 flex-1 pt-3">
                <h1 className="text-[1.65rem] font-black leading-[1.1] tracking-[-0.04em] drop-shadow sm:text-3xl">
                  {manga.title}
                </h1>
                {manga.author && <p className="mt-3 text-sm text-zinc-400">By <span className="text-brand-400">{manga.author}</span></p>}
                {manga.artist && manga.artist !== manga.author && (
                  <p className="text-sm text-zinc-400">Art: {manga.artist}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {manga.genre.slice(0, 3).map((genre) => <Chip key={genre}>{genre}</Chip>)}
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <StarIcon className="h-6 w-6 text-amber-400" />
                  <span className="text-xl font-bold">Featured</span>
                </div>
                <p className="mt-2 text-xs text-zinc-500">{mangaStatusLabel(manga.status)} · {manga.source?.displayName}</p>
              </div>
            </div>

            <div className="mt-5">
              {manga.firstUnreadChapter ? (
                <Link
                  to={`/manga/${mangaId}/chapter/${manga.firstUnreadChapter.id}`}
                  className="brand-gradient flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:brightness-110"
                >
                  <BookOpenIcon className="h-5 w-5" />
                  {manga.unreadCount > 0 ? 'Continue reading' : 'Read from start'}
                </Link>
              ) : (
                <div className="flex w-full items-center justify-center rounded-xl bg-white/5 px-6 py-3.5 text-sm font-medium text-zinc-500">
                  All caught up
                </div>
              )}
              <div className="mt-2">
                <button
                  onClick={toggleLibrary}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                    inLibrary
                      ? 'border-brand-500/40 bg-brand-500/15 text-brand-300'
                      : 'border-white/10 bg-[#0c0f16] text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  <BookmarkIcon className="h-5 w-5" />
                  {inLibrary ? 'Bookmarked' : 'Bookmark'}
                </button>
              </div>
            </div>

            {manga.description && (
              <div className="mt-7 border-b border-white/[0.08] pb-5">
                <h2 className="mb-1.5 text-lg font-semibold text-zinc-100">Synopsis</h2>
                <Description text={manga.description} />
              </div>
            )}

            <ChapterList mangaId={mangaId} initializing={initializing} thumbnailUrl={manga.thumbnailUrl} />
          </>
        )}
      </div>
      <DetailBottomNav />
    </div>
  );
}

function Description({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <p className={`whitespace-pre-line text-sm leading-relaxed text-zinc-300 ${expanded ? '' : 'line-clamp-3'}`}>
        {text}
      </p>
      <button onClick={() => setExpanded((v) => !v)} className="mt-1 text-sm font-medium text-brand-400 hover:text-brand-300">
        {expanded ? 'Less' : 'More'}
      </button>
    </div>
  );
}

function ChapterList({
  mangaId,
  initializing,
  thumbnailUrl,
}: {
  mangaId: number;
  initializing: boolean;
  thumbnailUrl?: string | null;
}) {
  const [limit, setLimit] = useState(CHAPTER_PAGE);
  const [desc, setDesc] = useState(true);
  const context = useMemo(() => ({ additionalTypenames: ['ChapterType'] }), []);
  const [{ data, fetching, error }] = useQuery({
    query: MangaChaptersQuery,
    variables: {
      mangaId,
      first: limit,
      order: [{ by: 'SOURCE_ORDER', byType: desc ? 'DESC' : 'ASC' }],
    },
    context,
  });
  const list = data?.chapters;
  const nodes = list?.nodes ?? [];
  const showLoading = initializing || (fetching && nodes.length === 0);

  return (
    <section className="mt-5 pb-10">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">
          Chapters {list && list.totalCount > 0 && <span className="text-zinc-600">· {list.totalCount}</span>}
        </h2>
        <button
          onClick={() => setDesc((v) => !v)}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10"
        >
          {desc ? 'View All' : 'Oldest first'}
        </button>
      </div>

      {error && <ErrorState message={`Failed to load chapters: ${error.message}`} />}

      {nodes.length > 0 && (
        <ul className="space-y-2">
          {nodes.map((chapter) => (
            <li key={chapter.id}>
              <Link
                to={`/manga/${mangaId}/chapter/${chapter.id}`}
                className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#0b0e15] p-2 transition-colors hover:bg-white/5 active:bg-white/10"
              >
                <div className="h-14 w-11 shrink-0 overflow-hidden rounded-md bg-zinc-800">
                  {thumbnailUrl && <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm ${chapter.isRead ? 'text-zinc-500' : 'text-zinc-100'}`}>
                    {chapterLabel(chapter.name, chapter.chapterNumber)}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-2 text-xs text-zinc-500">
                    {formatEpochMs(chapter.uploadDate) && <span>{formatEpochMs(chapter.uploadDate)}</span>}
                    {chapter.scanlator && <span className="truncate">· {chapter.scanlator}</span>}
                    {chapter.pageCount > 0 && <span>· {chapter.pageCount}p</span>}
                    {!chapter.isRead && chapter.lastPageRead > 0 && (
                      <span className="text-brand-400">· resume p{chapter.lastPageRead + 1}</span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {chapter.isBookmarked && <BookmarkIcon className="h-4 w-4 text-amber-400" />}
                  <ChevronLeftIcon className="h-5 w-5 rotate-180 text-zinc-600" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {showLoading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!showLoading && list && nodes.length === 0 && (
        <p className="rounded-2xl border border-white/5 bg-zinc-900/40 px-4 py-6 text-center text-sm text-zinc-500">
          No chapters found.
        </p>
      )}

      {list?.pageInfo.hasNextPage && (
        <LoadMoreButton onClick={() => setLimit((l) => l + CHAPTER_PAGE)} loading={fetching} />
      )}
    </section>
  );
}

function DetailBottomNav() {
  const items = [
    { to: '/', label: 'Home', Icon: HomeIcon },
    { to: '/sources', label: 'Discover', Icon: CompassIcon },
    { to: '/library', label: 'Library', Icon: LibraryIcon },
    { to: '/settings', label: 'Profile', Icon: UserIcon },
  ];
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.07] bg-[#05070b]/95 backdrop-blur-xl md:hidden">
      <div className="flex h-[4.25rem]">
        {items.map(({ to, label, Icon }) => (
          <Link key={to} to={to} className={`flex flex-1 flex-col items-center justify-center gap-0.5 ${to === '/library' ? 'text-brand-400' : 'text-zinc-500'}`}>
            <Icon className="h-5.5 w-5.5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex gap-4 sm:gap-6">
      <Skeleton className="aspect-2/3 w-28 rounded-2xl sm:w-40" />
      <div className="flex-1 space-y-3 pt-2">
        <Skeleton className="h-7 w-3/4 rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />
        <Skeleton className="h-6 w-2/3 rounded-full" />
      </div>
    </div>
  );
}
