import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from './icons';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-zinc-800/60 ${className}`}>
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent [animation:shimmer_1.6s_infinite]" />
    </div>
  );
}

export function CoverGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <Skeleton className="aspect-2/3 w-full rounded-xl" />
          <Skeleton className="mt-2 h-3 w-4/5 rounded" />
        </li>
      ))}
    </ul>
  );
}

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin text-zinc-400 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  );
}

export function PageHeader({
  title,
  subtitle,
  backTo,
  actions,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  backTo?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-white/[0.06] bg-[#030509]/90 backdrop-blur-2xl">
      <div className="flex h-16 items-center gap-2 px-4">
        {backTo && (
          <Link
            to={backTo}
            className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-300 hover:bg-white/5 active:bg-white/10"
            aria-label="Back"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold tracking-tight text-zinc-50">{title}</h1>
          {subtitle && <p className="truncate text-xs text-zinc-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </div>
      {children}
    </header>
  );
}

export function LoadMoreButton({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  return (
    <div className="mt-8 flex justify-center">
      <button
        onClick={onClick}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10 disabled:opacity-50"
      >
        {loading && <Spinner className="h-4 w-4" />}
        Load more
      </button>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-sm font-medium text-zinc-300">{title}</p>
      {hint && <p className="mt-1.5 max-w-xs text-sm text-zinc-500">{hint}</p>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="mx-auto mt-6 max-w-md rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
      {message}
    </div>
  );
}

export function Chip({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' }) {
  const tones = {
    neutral: 'bg-white/5 text-zinc-300 ring-white/10',
    accent: 'bg-brand-500/15 text-brand-300 ring-brand-500/20',
  };
  return (
    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}
