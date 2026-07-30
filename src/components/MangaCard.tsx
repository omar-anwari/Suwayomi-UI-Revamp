import { Link } from 'react-router-dom';
import { CheckIcon } from './icons';

export function MangaCard({
  id,
  title,
  thumbnailUrl,
  unreadCount,
  inLibrary,
}: {
  id: number;
  title: string;
  thumbnailUrl?: string | null;
  unreadCount?: number;
  inLibrary?: boolean;
}) {
  return (
    <Link to={`/manga/${id}`} className="group block">
      <div className="relative aspect-2/3 overflow-hidden rounded-xl bg-zinc-900 shadow-lg shadow-black/40 ring-1 ring-white/5 transition duration-200 group-hover:ring-white/20 group-active:scale-[0.98]">
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

        {unreadCount != null && unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 rounded-md bg-brand-500 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white shadow-md shadow-black/30">
            {unreadCount}
          </span>
        )}
        {inLibrary && (
          <span
            title="In library"
            className="absolute left-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-md bg-emerald-500 text-white shadow-md shadow-black/30"
          >
            <CheckIcon className="h-3.5 w-3.5" />
          </span>
        )}

      </div>
      <p className="mt-1.5 line-clamp-2 text-xs font-medium leading-tight text-zinc-300 transition-colors group-hover:text-white sm:text-[13px]">
        {title}
      </p>
    </Link>
  );
}
