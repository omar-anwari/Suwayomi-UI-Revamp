import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'urql';
import { LibraryFullQuery } from '../operations';
import { MangaCard } from './MangaCard';
import { PageHeader, CoverGridSkeleton, EmptyState, ErrorState } from './ui';
import { BellIcon, MoreVerticalIcon, SearchIcon } from './icons';
import { chapterLabel } from '../format';
import { Brand } from './Brand';

const GRID = 'grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8';
const num = (s?: string | null) => (s ? Number(s) : 0);

type Tab = 'library' | 'bookmarks' | 'history';

export function Library() {
  const [tab, setTab] = useState<Tab>('library');
  const [{ data, fetching, error }] = useQuery({ query: LibraryFullQuery, variables: { first: 500 } });
  const nodes = useMemo(() => data?.mangas.nodes ?? [], [data]);

  const reading = useMemo(
    () =>
      nodes
        .filter((m) => m.unreadCount > 0 && m.lastReadChapter && m.firstUnreadChapter)
        .sort((a, b) => num(b.lastReadChapter?.lastReadAt) - num(a.lastReadChapter?.lastReadAt)),
    [nodes],
  );

  const history = useMemo(
    () =>
      nodes
        .filter((m) => m.lastReadChapter)
        .sort((a, b) => num(b.lastReadChapter?.lastReadAt) - num(a.lastReadChapter?.lastReadAt)),
    [nodes],
  );

  return (
    <>
      <PageHeader
        title={
          <>
            <span className="md:hidden"><Brand link compact /></span>
            <span className="hidden md:inline">Library</span>
          </>
        }
        actions={
          <>
            <Link to="/sources" className="grid h-10 w-10 place-items-center rounded-full text-zinc-200 md:hidden" aria-label="Search">
              <SearchIcon className="h-5.5 w-5.5" />
            </Link>
            <button className="relative grid h-10 w-10 place-items-center rounded-full text-zinc-200 md:hidden" aria-label="Notifications">
              <BellIcon className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-magenta-400 ring-2 ring-[#030509]" />
            </button>
          </>
        }
      >
        <div className="mx-4 mb-3 grid grid-cols-3 overflow-hidden rounded-xl bg-white/[0.05] p-0.5 sm:mx-6">
          <TabButton active={tab === 'library'} onClick={() => setTab('library')}>
            Library
          </TabButton>
          <TabButton active={tab === 'bookmarks'} onClick={() => setTab('bookmarks')}>
            Bookmarks
          </TabButton>
          <TabButton active={tab === 'history'} onClick={() => setTab('history')}>
            History
          </TabButton>
        </div>
      </PageHeader>

      <main className="mx-auto max-w-[1280px] px-4 py-4 sm:px-6 sm:py-6">
        {error && <ErrorState message={`Failed to load library: ${error.message}`} />}
        {!data && fetching && <CoverGridSkeleton />}

        {data && nodes.length === 0 && (
          <EmptyState title="Your library is empty" hint="Head to Browse to add manga from a source." />
        )}

        {data && nodes.length > 0 && tab === 'library' && (
          <div className="space-y-8">
            {reading.length > 0 && (
              <section>
                <SectionHead title="Continue Reading" onViewAll={() => setTab('history')} />
                <ul className="space-y-2">
                  {reading.slice(0, 4).map((m) => (
                    <ContinueRow key={m.id} m={m} />
                  ))}
                </ul>
              </section>
            )}
            <section>
              <SectionHead title="Saved Titles" />
              <ul className={GRID}>
                {nodes.map((m) => (
                  <li key={m.id}>
                    <MangaCard id={m.id} title={m.title} thumbnailUrl={m.thumbnailUrl} unreadCount={m.unreadCount} />
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {data && tab === 'bookmarks' &&
          (nodes.length > 0 ? (
            <ul className={GRID}>
              {nodes.map((m) => (
                <li key={m.id}>
                  <MangaCard id={m.id} title={m.title} thumbnailUrl={m.thumbnailUrl} unreadCount={m.unreadCount} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No bookmarks yet" hint="Save titles to find them here." />
          ))}

        {data && tab === 'history' &&
          (history.length > 0 ? (
            <ul className={GRID}>
              {history.map((m) => (
                <li key={m.id}>
                  <MangaCard id={m.id} title={m.title} thumbnailUrl={m.thumbnailUrl} unreadCount={m.unreadCount} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No reading history yet" />
          ))}

      </main>
    </>
  );
}

type LibNode = {
  id: number;
  title: string;
  thumbnailUrl?: string | null;
  unreadCount: number;
  chapters: { totalCount: number };
  firstUnreadChapter?: { id: number; name: string; chapterNumber: number } | null;
};

function ContinueRow({ m }: { m: LibNode }) {
  const total = m.chapters.totalCount;
  const pct = total > 0 ? Math.round(((total - m.unreadCount) / total) * 100) : 0;
  const to = m.firstUnreadChapter ? `/manga/${m.id}/chapter/${m.firstUnreadChapter.id}` : `/manga/${m.id}`;
  return (
    <li>
      <Link
        to={to}
      className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#0a0d14]/80 p-2.5 transition-colors hover:border-white/15 hover:bg-[#10141e]"
      >
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-zinc-800 ring-1 ring-white/5">
          {m.thumbnailUrl && (
            <img src={m.thumbnailUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-100">{m.title}</p>
          <p className="mt-0.5 truncate text-xs text-zinc-500">
            {m.firstUnreadChapter ? chapterLabel(m.firstUnreadChapter.name, m.firstUnreadChapter.chapterNumber) : ''}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-magenta-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-medium tabular-nums text-zinc-300">{pct}%</span>
          </div>
        </div>
        <MoreVerticalIcon className="h-5 w-5 shrink-0 text-zinc-500" />
      </Link>
    </li>
  );
}

function SectionHead({ title, onViewAll }: { title: string; onViewAll?: () => void }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-100">{title}</h2>
      {onViewAll && (
        <button onClick={onViewAll} className="text-xs font-medium text-brand-400 hover:text-brand-300">
          View All
        </button>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`min-w-0 rounded-[0.65rem] px-1.5 py-2.5 text-[11px] font-medium transition-colors sm:text-sm ${
        active
          ? 'brand-gradient text-white shadow'
          : 'text-zinc-300 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}
