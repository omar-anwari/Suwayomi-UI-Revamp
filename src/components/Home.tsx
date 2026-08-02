import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from 'urql';
import { HomeMangasQuery, BrowseSourceMutation, ContinueReadingQuery } from '../operations';
import { Rail, RailCard } from './Rail';
import { EmptyState, ErrorState, Skeleton } from './ui';
import { MoreVerticalIcon, SearchIcon, StarIcon } from './icons';
import { chapterLabel, formatEpochMs } from '../format';
import { Brand } from './Brand';

const num = (s?: string | null) => (s ? Number(s) : 0);

type SourceManga = { id: number; title: string; thumbnailUrl?: string | null; inLibrary: boolean };

const trendingCache = new Map<string, SourceManga[]>();

type ContinueEntry = {
  mangaId: number;
  title: string;
  thumbnailUrl?: string | null;
  to: string;
  progress: number;
  caption: string;
};

function useContinueReading(): ContinueEntry[] {
  const [{ data }] = useQuery({ query: ContinueReadingQuery, variables: { first: 80 } });

  return useMemo(() => {
    const seen = new Set<number>();
    const entries: ContinueEntry[] = [];

    for (const chapter of data?.chapters.nodes ?? []) {
      if (seen.has(chapter.mangaId)) continue;
      seen.add(chapter.mangaId);

      const manga = chapter.manga;
      const partRead = !chapter.isRead && chapter.lastPageRead > 0;

      const next = manga.firstUnreadChapter;
      const to = partRead
        ? `/manga/${manga.id}/chapter/${chapter.id}`
        : next
          ? `/manga/${manga.id}/chapter/${next.id}`
          : `/manga/${manga.id}`;

      const caption = partRead
        ? `${chapterLabel(chapter.name, chapter.chapterNumber)} · p${chapter.lastPageRead + 1}`
        : next
          ? 'Next chapter ready'
          : 'All caught up';

      entries.push({
        mangaId: manga.id,
        title: manga.title,
        thumbnailUrl: manga.thumbnailUrl,
        to,
        progress: partRead && chapter.pageCount > 0 ? chapter.lastPageRead / chapter.pageCount : 0,
        caption,
      });

      if (entries.length >= 14) break;
    }

    return entries;
  }, [data]);
}

export function Home() {
  const [{ data, fetching, error }] = useQuery({ query: HomeMangasQuery, variables: { first: 500 } });
  const nodes = useMemo(() => data?.mangas.nodes ?? [], [data]);

  const continueReading = useContinueReading();

  const recentlyUpdated = useMemo(
    () =>
      nodes
        .filter((m) => m.latestUploadedChapter)
        .sort((a, b) => num(b.latestUploadedChapter?.uploadDate) - num(a.latestUploadedChapter?.uploadDate))
        .slice(0, 12),
    [nodes],
  );

  const topGenres = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of nodes) for (const g of m.genre) counts.set(g, (counts.get(g) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([g]) => g);
  }, [nodes]);

  const topSource = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>();
    for (const m of nodes) {
      if (m.source && m.sourceId !== '0') {
        const e = counts.get(m.source.id) ?? { name: m.source.displayName, count: 0 };
        e.count += 1;
        counts.set(m.source.id, e);
      }
    }
    let best: { id: string; name: string } | null = null;
    let bestN = 0;
    counts.forEach((v, id) => {
      if (v.count > bestN) {
        bestN = v.count;
        best = { id, name: v.name };
      }
    });
    return best as { id: string; name: string } | null;
  }, [nodes]);

  const [, browse] = useMutation(BrowseSourceMutation);
  const [sourcePopular, setSourcePopular] = useState<SourceManga[]>([]);
  useEffect(() => {
    if (!topSource) return;
    const cached = trendingCache.get(topSource.id);
    if (cached) {
      setSourcePopular(cached);
      return;
    }
    let cancelled = false;
    browse({ source: topSource.id, type: 'POPULAR', page: 1 }).then((res) => {
      const mangas = res.data?.fetchSourceManga?.mangas ?? [];
      if (mangas.length > 0) trendingCache.set(topSource.id, mangas);
      if (!cancelled) setSourcePopular(mangas);
    });
    return () => {
      cancelled = true;
    };
  }, [topSource, browse]);

  const hero =
    recentlyUpdated.find((manga) => Boolean(manga.thumbnailUrl)) ??
    nodes.find((manga) => Boolean(manga.thumbnailUrl)) ??
    recentlyUpdated[0] ??
    nodes[0];
  const trending: SourceManga[] =
    sourcePopular.length > 0
      ? sourcePopular
      : recentlyUpdated.map((m) => ({ id: m.id, title: m.title, thumbnailUrl: m.thumbnailUrl, inLibrary: true }));

  return (
    <div className="min-h-dvh">
      <TopBar />

      {error && <ErrorState message={`Failed to load: ${error.message}`} />}
      {!data && fetching && <HomeSkeleton />}
      {data && nodes.length === 0 && (
        <EmptyState title="Your library is empty" hint="Open Browse to add manga from a source." />
      )}

      {hero && (
        <main className="mx-auto max-w-[1280px] space-y-6 pb-8 pt-3 sm:pt-5">
          <FeaturedHero manga={hero} />
          {continueReading.length > 0 && (
            <Rail title="Continue Reading" seeAllTo="/library">
              {continueReading.map((entry) => (
                <RailCard
                  key={entry.mangaId}
                  id={entry.mangaId}
                  to={entry.to}
                  title={entry.title}
                  thumbnailUrl={entry.thumbnailUrl}
                  progress={entry.progress}
                  caption={entry.caption}
                />
              ))}
            </Rail>
          )}
          {topGenres.length > 0 && <Categories genres={topGenres} />}
          {trending.length > 0 && (
            <Rail title="Trending Now" seeAllTo={topSource ? `/sources/${topSource.id}` : undefined}>
              {trending.map((m) => (
                <RailCard
                  key={m.id}
                  id={m.id}
                  title={m.title}
                  thumbnailUrl={m.thumbnailUrl}
                  inLibrary={m.inLibrary}
                />
              ))}
            </Rail>
          )}
          <RecentlyUpdated items={recentlyUpdated} />
        </main>
      )}
    </div>
  );
}

function TopBar() {
  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-white/[0.06] bg-glass/88 backdrop-blur-2xl md:hidden">
      <div className="flex h-16 items-center px-4">
        <Brand link compact />
        <div className="ml-auto flex items-center gap-1">
          <Link to="/sources" className="grid h-10 w-10 place-items-center rounded-full text-zinc-100" aria-label="Search">
            <SearchIcon className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function FeaturedHero({
  manga,
}: {
  manga: {
    id: number;
    title: string;
    thumbnailUrl?: string | null;
    unreadCount: number;
    genre: string[];
    description?: string | null;
    firstUnreadChapter?: { id: number } | null;
  };
}) {
  const readTo = manga.firstUnreadChapter
    ? `/manga/${manga.id}/chapter/${manga.firstUnreadChapter.id}`
    : `/manga/${manga.id}`;
  const readLabel = manga.firstUnreadChapter && manga.unreadCount > 0 ? 'Continue Reading' : 'Read Now';

  return (
    <section className="px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-surface shadow-2xl shadow-black/20 sm:rounded-2xl">
        {manga.thumbnailUrl && (
          <img
            src={manga.thumbnailUrl}
            alt={`${manga.title} cover`}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-[64%_center]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-app via-app/76 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-app/75 via-transparent to-app/10" />

        <div className="relative flex min-h-[18.5rem] max-w-xl flex-col justify-end p-4 sm:min-h-[21rem] sm:p-8">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-400">Featured</p>
          <h1 className="max-w-md text-2xl font-black leading-[1.08] tracking-[-0.03em] drop-shadow sm:text-4xl">{manga.title}</h1>
          {manga.genre.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-zinc-300">
              {manga.genre.slice(0, 3).map((g, i) => (
                <span key={g} className="flex items-center gap-2.5">
                  {i > 0 && <span className="h-1 w-1 rounded-full bg-brand-500" />}
                  {g}
                </span>
              ))}
            </div>
          )}
          {manga.description && (
            <p className="mt-3 line-clamp-2 max-w-md text-xs leading-5 text-zinc-300/90 sm:text-sm">{manga.description}</p>
          )}
          <div className="mt-4 flex items-center gap-2.5">
            <Link
              to={readTo}
              className="brand-gradient rounded-lg px-5 py-2.5 text-xs font-semibold text-on-brand shadow-lg shadow-brand-500/30 transition hover:brightness-110 sm:text-sm"
            >
              {readLabel}
            </Link>
            <Link
              to={`/manga/${manga.id}`}
              className="rounded-lg border border-white/15 bg-black/25 px-4 py-2.5 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-white/15 sm:text-sm"
            >
              View Details
            </Link>
          </div>
        </div>
        <div className="absolute bottom-4 right-4 hidden items-center gap-1.5 rounded-lg border border-white/10 bg-black/55 px-3 py-2 text-sm font-semibold backdrop-blur sm:flex">
          <StarIcon className="h-4 w-4 text-amber-400" />
          <span>{manga.unreadCount > 0 ? `${manga.unreadCount} unread` : 'Featured'}</span>
        </div>
      </div>
    </section>
  );
}

function Categories({ genres }: { genres: string[] }) {
  return (
    <section className="hidden md:block">
      <h2 className="mb-2.5 px-4 text-lg font-semibold tracking-tight text-zinc-100 sm:px-6">Categories</h2>
      <div className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
        {genres.map((g) => (
          <Link
            key={g}
            to={`/genre/${encodeURIComponent(g)}`}
            className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-brand-500/40 hover:bg-brand-500/10 hover:text-white"
          >
            {g}
          </Link>
        ))}
      </div>
    </section>
  );
}

type UpdatedItem = {
  id: number;
  title: string;
  thumbnailUrl?: string | null;
  unreadCount: number;
  latestUploadedChapter?: { name: string; chapterNumber: number; uploadDate: string } | null;
};

function RecentlyUpdated({ items }: { items: UpdatedItem[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between px-4 sm:px-6">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-100">Recently Updated</h2>
        <Link to="/library" className="text-xs font-medium text-brand-400 hover:text-brand-300">
          View All
        </Link>
      </div>
      <ul className="grid grid-cols-1 gap-2 px-4 sm:grid-cols-2 sm:px-6 xl:grid-cols-4">
        {items.slice(0, 8).map((m) => (
          <li key={m.id}>
            <Link
              to={`/manga/${m.id}`}
              className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-surface/80 p-2 transition-colors hover:border-white/15 hover:bg-raised"
            >
              <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md bg-zinc-800 ring-1 ring-white/5">
                {m.thumbnailUrl && (
                  <img src={m.thumbnailUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-100">{m.title}</p>
                <p className="mt-0.5 truncate text-xs text-zinc-500">
                  {m.latestUploadedChapter &&
                    chapterLabel(m.latestUploadedChapter.name, m.latestUploadedChapter.chapterNumber)}
                  {m.latestUploadedChapter?.uploadDate &&
                    formatEpochMs(m.latestUploadedChapter.uploadDate) &&
                    ` · ${formatEpochMs(m.latestUploadedChapter.uploadDate)}`}
                </p>
              </div>
              <MoreVerticalIcon className="h-5 w-5 shrink-0 text-zinc-400" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HomeSkeleton() {
  return (
    <div className="pt-4">
      <div className="px-4 sm:px-6">
        <Skeleton className="h-[22rem] w-full rounded-2xl sm:h-[24rem] sm:rounded-3xl" />
      </div>
      {Array.from({ length: 2 }).map((_, r) => (
        <div key={r} className="mt-7">
          <Skeleton className="mx-4 mb-3 h-5 w-40 rounded sm:mx-6" />
          <div className="flex gap-3 overflow-hidden px-4 sm:gap-4 sm:px-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-2/3 w-28 shrink-0 rounded-xl sm:w-36" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
