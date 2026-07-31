import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from 'urql';
import { LibraryUpdatesQuery, UpdateLibraryMutation, LibraryUpdateStatusQuery } from '../operations';
import { chapterLabel, fetchedAtToMs, formatDayLabel, formatTimeOfDay } from '../format';
import { EmptyState, ErrorState, LoadMoreButton, PageHeader, Skeleton } from './ui';
import { BookOpenIcon, CheckIcon, RefreshIcon } from './icons';
import { Brand } from './Brand';

const PAGE = 120;
const SETTLE_MS = 2500;

type ChapterNode = {
  id: number;
  name: string;
  chapterNumber: number;
  fetchedAt: string;
  isRead: boolean;
  isDownloaded: boolean;
  lastPageRead: number;
  mangaId: number;
  manga: { id: number; title: string; thumbnailUrl?: string | null };
};

export function Updates() {
  const [limit, setLimit] = useState(PAGE);
  const [{ data, fetching, error }, refetchUpdates] = useQuery({
    query: LibraryUpdatesQuery,
    variables: { first: limit },
  });

  const nodes = useMemo(() => (data?.chapters.nodes ?? []) as ChapterNode[], [data]);

  const days = useMemo(() => {
    const byDay = new Map<
      string,
      { label: string; sort: number; mangas: Map<number, { manga: ChapterNode['manga']; chapters: ChapterNode[]; latest: number }> }
    >();

    for (const chapter of nodes) {
      const ms = fetchedAtToMs(chapter.fetchedAt);
      const key = new Date(ms).toDateString();
      let day = byDay.get(key);
      if (!day) {
        day = { label: formatDayLabel(ms), sort: ms, mangas: new Map() };
        byDay.set(key, day);
      }
      day.sort = Math.max(day.sort, ms);

      let entry = day.mangas.get(chapter.mangaId);
      if (!entry) {
        entry = { manga: chapter.manga, chapters: [], latest: ms };
        day.mangas.set(chapter.mangaId, entry);
      }
      entry.chapters.push(chapter);
      entry.latest = Math.max(entry.latest, ms);
    }

    return [...byDay.values()]
      .sort((a, b) => b.sort - a.sort)
      .map((day) => ({
        label: day.label,
        mangas: [...day.mangas.values()].sort((a, b) => b.latest - a.latest),
      }));
  }, [nodes]);

  const unreadTotal = useMemo(() => nodes.filter((c) => !c.isRead).length, [nodes]);

  const [, updateLibrary] = useMutation(UpdateLibraryMutation);
  const [justStarted, setJustStarted] = useState(false);

  const [{ data: statusData }, refetchStatus] = useQuery({
    query: LibraryUpdateStatusQuery,
    requestPolicy: 'network-only',
  });

  const jobs = statusData?.libraryUpdateStatus.jobsInfo;
  const serverRunning = jobs?.isRunning ?? false;
  const refreshing = serverRunning || justStarted;

  useEffect(() => {
    if (!justStarted) return;
    if (serverRunning) {
      setJustStarted(false);
      return;
    }
    const timer = window.setTimeout(() => setJustStarted(false), SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [justStarted, serverRunning]);

  useEffect(() => {
    const period = refreshing ? 2000 : 8000;
    const timer = window.setInterval(() => refetchStatus({ requestPolicy: 'network-only' }), period);
    return () => window.clearInterval(timer);
  }, [refreshing, refetchStatus]);

  const wasRunning = useRef(false);
  useEffect(() => {
    if (wasRunning.current && !serverRunning) {
      refetchUpdates({ requestPolicy: 'network-only' });
    }
    wasRunning.current = serverRunning;
  }, [serverRunning, refetchUpdates]);

  async function onRefresh() {
    if (refreshing) return;
    setJustStarted(true);
    const res = await updateLibrary({});
    if (res.error) setJustStarted(false);
    refetchStatus({ requestPolicy: 'network-only' });
  }

  const progress = serverRunning && jobs && jobs.totalJobs > 0 ? `${jobs.finishedJobs}/${jobs.totalJobs}` : null;
  const progressPct =
    serverRunning && jobs && jobs.totalJobs > 0 ? Math.round((jobs.finishedJobs / jobs.totalJobs) * 100) : 0;

  return (
    <>
      <PageHeader
        title={
          <>
            <span className="md:hidden">
              <Brand link compact />
            </span>
            <span className="hidden md:inline">Updates</span>
          </>
        }
        subtitle={
          data ? (unreadTotal > 0 ? `${unreadTotal} unread in recent updates` : 'All caught up') : undefined
        }
        actions={
          // While a refresh runs the progress bar below owns the status, so
          // hide this to avoid showing the same thing twice. It comes back
          // once the run finishes.
          refreshing ? null : (
            <button
              onClick={onRefresh}
              aria-label="Check for updates"
              title="Check for updates"
              className="flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5"
            >
              <RefreshIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )
        }
      />

      <main className="mx-auto max-w-[1280px] px-4 py-4 sm:px-6 sm:py-6">
        <h1 className="mb-4 text-lg font-semibold tracking-tight text-zinc-100 md:hidden">Updates</h1>

        {refreshing && (
          <div className="mb-4 rounded-xl border border-white/[0.07] bg-[#0a0d14]/80 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
              <RefreshIcon className="h-4 w-4 animate-spin text-brand-400" />
              <span>Checking sources for new chapters…</span>
              {progress && <span className="ml-auto tabular-nums text-zinc-400">{progress}</span>}
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full brand-gradient transition-[width] duration-500 ${
                  progressPct === 0 ? 'animate-pulse w-1/4' : ''
                }`}
                style={progressPct > 0 ? { width: `${progressPct}%` } : undefined}
              />
            </div>
          </div>
        )}

        {error && <ErrorState message={`Failed to load updates: ${error.message}`} />}

        {!data && fetching && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        )}

        {data && nodes.length === 0 && (
          <EmptyState
            title="No updates yet"
            hint="Chapters from titles in your library will appear here. Try Refresh to check your sources."
          />
        )}

        {days.length > 0 && (
          <div className="space-y-7">
            {days.map((day) => (
              <section key={day.label}>
                <h2 className="mb-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  {day.label}
                </h2>
                <ul className="space-y-2">
                  {day.mangas.map((entry) => (
                    <UpdateCard key={`${day.label}-${entry.manga.id}`} manga={entry.manga} chapters={entry.chapters} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        {data?.chapters.pageInfo.hasNextPage && (
          <LoadMoreButton onClick={() => setLimit((l) => l + PAGE)} loading={fetching} />
        )}
      </main>
    </>
  );
}

function UpdateCard({
  manga,
  chapters,
}: {
  manga: ChapterNode['manga'];
  chapters: ChapterNode[];
}) {
  const [expanded, setExpanded] = useState(false);
  const sorted = useMemo(() => [...chapters].sort((a, b) => b.chapterNumber - a.chapterNumber), [chapters]);
  const visible = expanded ? sorted : sorted.slice(0, 3);
  const unread = sorted.filter((c) => !c.isRead).length;
  const resumeTo = sorted.find((c) => !c.isRead) ?? sorted[0];

  return (
    <li className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0a0d14]/80 transition-colors hover:border-white/15">
      <div className="flex items-center gap-3 p-2.5">
        <Link to={`/manga/${manga.id}`} className="shrink-0">
          <div className="h-20 w-14 overflow-hidden rounded-lg bg-zinc-800 ring-1 ring-white/5">
            {manga.thumbnailUrl && (
              <img src={manga.thumbnailUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            )}
          </div>
        </Link>

        <div className="min-w-0 flex-1">
          <Link to={`/manga/${manga.id}`} className="block">
            <p className="truncate text-sm font-semibold text-zinc-100">{manga.title}</p>
          </Link>
          <p className="mt-0.5 text-xs text-zinc-500">
            {sorted.length} new chapter{sorted.length === 1 ? '' : 's'}
            {unread > 0 && <span className="text-brand-400"> · {unread} unread</span>}
          </p>
        </div>

        {resumeTo && (
          <Link
            to={`/manga/${manga.id}/chapter/${resumeTo.id}`}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/5 text-zinc-200 transition-colors hover:bg-white/10"
            aria-label="Read"
            title="Read"
          >
            <BookOpenIcon className="h-4.5 w-4.5" />
          </Link>
        )}
      </div>

      <ul className="border-t border-white/[0.05]">
        {visible.map((chapter) => (
          <li key={chapter.id}>
            <Link
              to={`/manga/${manga.id}/chapter/${chapter.id}`}
              className="flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-white/[0.04]"
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${chapter.isRead ? 'bg-transparent' : 'bg-brand-500'}`}
              />
              <span className={`min-w-0 flex-1 truncate text-xs ${chapter.isRead ? 'text-zinc-500' : 'text-zinc-200'}`}>
                {chapterLabel(chapter.name, chapter.chapterNumber)}
              </span>
              {chapter.isDownloaded && <CheckIcon className="h-3.5 w-3.5 shrink-0 text-emerald-400" />}
              {!chapter.isRead && chapter.lastPageRead > 0 && (
                <span className="shrink-0 text-[11px] text-brand-400">p{chapter.lastPageRead + 1}</span>
              )}
              <span className="shrink-0 text-[11px] tabular-nums text-zinc-600">
                {formatTimeOfDay(fetchedAtToMs(chapter.fetchedAt))}
              </span>
            </Link>
          </li>
        ))}

        {sorted.length > 3 && (
          <li>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-full px-3 py-2 text-left text-[11px] font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-200"
            >
              {expanded ? 'Show less' : `Show ${sorted.length - 3} more`}
            </button>
          </li>
        )}
      </ul>
    </li>
  );
}
