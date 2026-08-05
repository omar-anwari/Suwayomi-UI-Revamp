import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BookmarkIcon } from './icons';

export function Rail({
  title,
  seeAllTo,
  children,
}: {
  title: string;
  seeAllTo?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-2.5 flex items-baseline justify-between px-4 sm:px-6">
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-zinc-100">{title}</h2>
        {seeAllTo && (
          <Link to={seeAllTo} className="text-xs font-medium text-brand-400 hover:text-brand-300">
            View All
          </Link>
        )}
      </div>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] sm:gap-4 sm:px-6 [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </section>
  );
}

export function RailCard({
  id,
  title,
  thumbnailUrl,
  unreadCount,
  inLibrary,
  progress,
  to,
  caption,
}: {
  id: number;
  title: string;
  thumbnailUrl?: string | null;
  unreadCount?: number;
  inLibrary?: boolean;
  progress?: number;
  to?: string;
  caption?: string;
}) {
  const detailTo = `/manga/${id}`;
  return (
    <div className="group w-[6.5rem] shrink-0 snap-start sm:w-36">
      <Link
        to={detailTo}
        aria-label={title}
        className="relative block aspect-2/3 overflow-hidden rounded-xl bg-zinc-900 shadow-lg shadow-black/40 ring-1 ring-white/5 transition duration-200 group-hover:ring-white/20 active:scale-[0.98]"
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-2 text-center text-xs text-zinc-600">
            {title}
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />

        {unreadCount != null && unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 rounded-md bg-brand-500 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-on-brand shadow-md shadow-black/30">
            {unreadCount}
          </span>
        )}
        {inLibrary && (
          <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-md bg-black/60 text-brand-300 shadow-md shadow-black/30 backdrop-blur">
            <BookmarkIcon className="h-3.5 w-3.5" />
          </span>
        )}

        {progress != null && progress > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/40">
            <div
              className="h-full bg-brand-500"
              style={{ width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }}
            />
          </div>
        )}

      </Link>
      <Link to={to ?? detailTo} className="block">
        <p className="mt-1.5 line-clamp-2 text-xs font-medium leading-tight text-zinc-200 transition-colors group-hover:text-white sm:text-[13px]">
          {title}
        </p>
        {caption && <p className="mt-0.5 truncate text-[11px] text-zinc-500">{caption}</p>}
      </Link>
    </div>
  );
}
